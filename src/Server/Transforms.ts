/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'
import * as LA from '../Utils/LinearAlgebra'

const enum Constants {
    Delta = 1e-4
}

export module Coords {
    export function map(f: (x: number, i: number) => number, a: number[]) {
        return [f(a[0], 0), f(a[1], 1), f(a[2], 2)];
    }

    export function add(a: number[], b: number[]) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
    }

    export function sub(a: number[], b: number[]) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    const u = { x: 0.1, y: 0.1, z: 0.1 };
    const v = { x: 0.1, y: 0.1, z: 0.1 };
    import applyTransform = LA.Matrix4.transformVector3;
    export function transformInPlace(x: number[], matrix: number[]) {
        u.x = x[0]; u.y = x[1]; u.z = x[2];
        applyTransform(v, u, matrix);
        x[0] = v.x; x[1] = v.y; x[2] = v.z;
        return x;
    }

    export function transform(x: number[], matrix: number[]) {
        return transformInPlace([x[0], x[1], x[2]], matrix);
    }

    export function mapIndices(map: number[], coord: number[]) {
        return [coord[map[0]], coord[map[1]], coord[map[2]]];
    }

    export function makeSpacegroup(header: Data.Header) {
        let { cellAngles, cellSize, gridSize, axisOrder } = header;

        let alpha = (Math.PI / 180.0) * cellAngles[0],
            beta = (Math.PI / 180.0) * cellAngles[1],
            gamma = (Math.PI / 180.0) * cellAngles[2];

        let xScale = cellSize[0] / gridSize[0],
            yScale = cellSize[1] / gridSize[1],
            zScale = cellSize[2] / gridSize[2];

        let z1 = Math.cos(beta),
            z2 = (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma)) / Math.sin(gamma),
            z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);

        let x = [xScale, 0.0, 0.0],
            y = [Math.cos(gamma) * yScale, Math.sin(gamma) * yScale, 0.0],
            z = [z1 * zScale, z2 * zScale, z3 * zScale];

        let fromFrac = LA.Matrix4.ofRows([
            [x[0], y[0], z[0], 0],
            [0, y[1], z[1], 0],
            [0, 0, z[2], 0],
            [0, 0, 0, 1.0]
        ]);
        let toFrac = LA.Matrix4.invert(LA.Matrix4.empty(), fromFrac)!;

        return { toFrac, fromFrac, cellDimensions: [xScale, yScale, zScale] };
    }
}

export module Box {

    export function zero(): Data.Box {
        return { a: [0,0,0], b: [0,0,0] };
    }

    export function shift(box: Data.Box, delta: number[]): Data.Box {
        return { a: Coords.add(box.a, delta), b: Coords.add(box.b, delta) };
    }

    export function dims(a: Data.Box) {
        return Coords.sub(a.b, a.a);
    }

    export function intersect(box1: Data.Box, box2: Data.Box): Data.Box | undefined {
        let a = [0.1, 0.1, 0.1];
        let b = [0.1, 0.1, 0.1];

        for (let i = 0; i < 3; i++) {
            let x = box1.a[i], y = box1.b[i];
            let u = box2.a[i], v = box2.b[i];
            if (x > v || y < u) return void 0;
            a[i] = Math.max(x, u);
            b[i] = Math.min(y, v);
        }

        return { a, b };
    }

    export function getBlockMetrics(ctx: Data.Context, coord: number[]) {
        let { info, header } = ctx;
        if (info.blockCount.some((v, i) => coord[i] >= v)) {
            throw Error(`Block coordinate exceeds block count.`);
        }

        let { blockSize, extent } = header;

        let sizeH = extent[0];
        let sizeHK = extent[0] * extent[1];

        let dimensions = Coords.map((e, i) => Math.min(blockSize, e - coord[i] * blockSize), extent);

        let N = ctx.header.numDensities;
        
        let offsets = [
            N * blockSize * dimensions[1] * dimensions[2] * coord[0],
            N * blockSize * extent[0] * dimensions[2] * coord[1],
            N * blockSize * extent[0] * extent[1] * coord[2]
        ];
        let dataOffset = header.dataByteOffset + Data.getElementByteSize(ctx.header) * (offsets[0] + offsets[1] + offsets[2]);
        
        let box: Data.Box = {
            a: Coords.map((c, i) => ctx.info.dataBox.a[i] + blockSize * c, coord),
            b: Coords.map((c, i) => ctx.info.dataBox.a[i] + blockSize * c + dimensions[i], coord)
        }

        return {
            box,
            dimensions,
            dataOffset
        }
    }


    function validate(box: Data.Box) {
        let { a, b } = box;
        for (let i = 0; i < 3; i++) {
            if (a[i] > b[i]) {
                let t = a[i];
                a[i] = b[i];
                b[i] = t;
            }
        }
        return box;
    }

    function snap(box: Data.Box): Data.Box {
        return {
            a: Coords.map(v => {
                let c = Math.ceil(v);
                if (c - v < Constants.Delta) return c;
                return Math.floor(v);
            }, box.a),
            b: Coords.map(v => {
                let f = Math.floor(v);
                if (v - f < Constants.Delta) return f;
                return Math.ceil(v);
            }, box.b),
        }
    }

    /**
     * Validates intervals and snaps to integer coordinates.
     */
    export function normalize(box: Data.Box) {
        return snap(validate(box));
    }

    /**
     * Map a box from orthogonal to "scaled" fractional coordinates.
     * 
     * Axis order is changed to that of the underlying density and
     * the coordinates are snapped to the grid points.
     */
    export function map(ctx: Data.Context, box: Data.Box) {
        box = validate(box);
        let { toFrac, grid } = ctx.info;
        let { axisOrder } = ctx.header;
        let { a: l, b: r } = box;
        let corners = [
            [l[0], l[1], l[2]],
            [r[0], l[1], l[2]],
            [l[0], r[1], l[2]],
            [l[0], l[1], r[2]],
            [r[0], r[1], l[2]],
            [r[0], l[1], r[2]],
            [l[0], r[1], r[2]],
            [r[0], r[1], r[2]],
        ].map(c => Coords.mapIndices(axisOrder, Coords.transform(c, toFrac)));

        let mapped: Data.Box = {
            a: corners.reduce((m, c) => Coords.map((v, i) => Math.min(v, m[i]), c) , corners[0]),
            b: corners.reduce((m, c) => Coords.map((v, i) => Math.max(v, m[i]), c) , corners[0])
        };

        return normalize(mapped);
    }
}

export module Query {
    export function getBlockHash(coord: number[], blockCount: number[]) {
        return (coord[0] + blockCount[0] * (coord[1] + coord[2] * blockCount[1]));
    }

    function overlapMultiplierRange(a: number, b: number, u: number, v: number, g: number, out: number[]): boolean {
        let x = Math.ceil((u - b) / g) | 0, y=  Math.floor((v - a) / g) | 0;
        if (b + x * g < u) x++;
        if (a + y * g > v) y--;
        if (x > y) return false;
        out[0] = x; 
        out[1] = y;
        return true;
    }

    const _tempRange = [0,0];
    /**
     * Find a 3D integer  range of multipliers of grid sizes that when added map 
     * source to target.
     * 
     * @example
     *   in 1D
     *   source: [1,2], target: [10,16], grid: 5 => [2,3]    
     */
    export function findOverlapTransformRange(source: Data.Box, target: Data.Box, grid: number[], out: Data.Box) {
        for (let i = 0; i < 3; i++) {
            if (!overlapMultiplierRange(source.a[i], source.b[i], target.a[i], target.b[i], grid[i], _tempRange)) return false;
            out.a[i] = _tempRange[0];
            out.b[i] = _tempRange[1];
        }
        return true;
    }
    
    function getBlockIndex(coord: number[], origin: number[], blockSize: number) {
        let index = [0,0,0];
        for (let i = 0; i < 3; i++) {
            let d = (coord[i] - origin[i]) | 0;
            index[i] = Math.floor(d / blockSize) | 0; 
        }
        return index;
    }
    
    function findBlocksAsymmetric(ctx: Data.Context, region: Data.Box) {
        let box = Box.intersect(ctx.info.dataBox, region);
        if (!box) return [];

        let blocks = [];
        let a = getBlockIndex(box.a, ctx.info.dataBox.a, ctx.header.blockSize);
        let b = getBlockIndex(Coords.sub(box.b, [1, 1, 1]), ctx.info.dataBox.a, ctx.header.blockSize);

        for (let k = a[2]; k <= b[2]; k++) {
            for (let j = a[1]; j <= b[1]; j++) {
                for (let i = a[0]; i <= b[0]; i++) {
                    blocks.push([i, j, k]);
                }
            }
        }

        return blocks;
    }

    function findBlocksSymmetric(ctx: Data.Context, region: Data.Box) {        
        let { dataBox, grid, blockCount } = ctx.info;
        let overlaps = Box.zero();        
        if (!findOverlapTransformRange(region, dataBox, grid, overlaps)) return [];
        let addedBlocks = new Set<number>();
        let blocks: number[][] = [];
        let delta = [0,0,0];
        let { a, b } = overlaps;
 
        for (let k = a[2]; k <= b[2]; k++) {
            delta[2] = k * grid[2];
            for (let j = a[1]; j <= b[1]; j++) {
                delta[1] = j * grid[1];
                for (let i = a[0]; i <= b[0]; i++) {
                    delta[0] = i * grid[0];
                    for (let block of findBlocksAsymmetric(ctx, Box.shift(region, delta))) {
                        let hash = getBlockHash(block, blockCount);
                        if (!addedBlocks.has(hash)) {
                            addedBlocks.add(hash);
                            blocks.push(block);
                        }
                    }
                }
            }
        }

        blocks.sort((x, y) => {
            for (let i = 2; i >= 0; i--) {
                if (x[i] !== y[i]) return x[i] - y[i];
            }
            return 0;
        });

        return blocks;
    }

    export function findBlockIndices(ctx: Data.Context, region: Data.Box): number[][] {
        if (ctx.info.isAsymmetric) return findBlocksAsymmetric(ctx, region);
        return findBlocksSymmetric(ctx, region);
    } 

    export function fillData1(block: Data.MultiBlock, data: Data.QueryData) {
        let region = Box.intersect(block.box, data.box);
        if (!region) return;

        let dataDims = Box.dims(data.box);
        let dataH = dataDims[0];
        let dataHK = dataDims[0] * dataDims[1];

        let [dH, dK, dL] = Coords.sub(region.a, data.box.a);
        let dataOffset = dH + dK * dataH + dL * dataHK;

        let blockSize = block.dimensions[0] * block.dimensions[1] * block.dimensions[2];
        let blockValues = block.values;
        let blockH = block.dimensions[0];
        let blockHK = block.dimensions[0] * block.dimensions[1];

        let [bH, bK, bL] = Coords.sub(region.a, block.box.a);
        let blockOffset = bH + bK * blockH + bL * blockHK;

        function fill() {
            let [cH, cK, cL] = Box.dims(region!);
            for (let index = 0; index < data.values.length; index++) {
                let values = data.values[index];
                for (let l = 0; l < cL; l++) {
                    for (let k = 0; k < cK; k++) {
                        for (let h = 0; h < cH; h++) {
                            let v = blockValues[blockSize * index + blockOffset + h + k * blockH + l * blockHK];
                            values[dataOffset + h + k * dataH + l * dataHK] = v;
                        }
                    }
                }
            }
        }

        fill();
    }

    export function fillData(data: Data.QueryData, block: Data.MultiBlock, dataShift: number[]) {

        let dataBox = Box.shift(data.box, dataShift);
        let region = Box.intersect(block.box, dataBox);
        if (!region) return;

        let dataDims = Box.dims(dataBox);
        let dataH = dataDims[0];
        let dataHK = dataDims[0] * dataDims[1];

        let [dH, dK, dL] = Coords.sub(region.a, dataBox.a);
        let dataOffset = dH + dK * dataH + dL * dataHK;

        let blockSize = block.dimensions[0] * block.dimensions[1] * block.dimensions[2];
        let blockValues = block.values;
        let blockH = block.dimensions[0];
        let blockHK = block.dimensions[0] * block.dimensions[1];

        let [bH, bK, bL] = Coords.sub(region.a, block.box.a);
        let blockOffset = bH + bK * blockH + bL * blockHK;

        function fill() {
            let [cH, cK, cL] = Box.dims(region!);
            for (let index = 0; index < data.values.length; index++) {
                let values = data.values[index];
                for (let l = 0; l < cL; l++) {
                    for (let k = 0; k < cK; k++) {
                        for (let h = 0; h < cH; h++) {
                            let v = blockValues[blockSize * index + blockOffset + h + k * blockH + l * blockHK];
                            values[dataOffset + h + k * dataH + l * dataHK] = v;
                        }
                    }
                }
            }
        }

        fill();
    }
}