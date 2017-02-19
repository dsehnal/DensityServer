/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
var Data = require("./DataModel");
var LA = require("../Utils/LinearAlgebra");
var Coords;
(function (Coords) {
    function map(f, a) {
        return [f(a[0], 0), f(a[1], 1), f(a[2], 2)];
    }
    Coords.map = map;
    function add(a, b) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }
    Coords.add = add;
    function sub(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }
    Coords.sub = sub;
    var u = { x: 0.1, y: 0.1, z: 0.1 };
    var v = { x: 0.1, y: 0.1, z: 0.1 };
    var applyTransform = LA.Matrix4.transformVector3;
    function transformInPlace(x, matrix) {
        u.x = x[0];
        u.y = x[1];
        u.z = x[2];
        applyTransform(v, u, matrix);
        x[0] = v.x;
        x[1] = v.y;
        x[2] = v.z;
        return x;
    }
    Coords.transformInPlace = transformInPlace;
    function transform(x, matrix) {
        return transformInPlace([x[0], x[1], x[2]], matrix);
    }
    Coords.transform = transform;
    function mapIndices(map, coord) {
        return [coord[map[0]], coord[map[1]], coord[map[2]]];
    }
    Coords.mapIndices = mapIndices;
    function makeSpacegroup(header) {
        var cellAngles = header.cellAngles, cellSize = header.cellSize, gridSize = header.gridSize, axisOrder = header.axisOrder;
        var alpha = (Math.PI / 180.0) * cellAngles[0], beta = (Math.PI / 180.0) * cellAngles[1], gamma = (Math.PI / 180.0) * cellAngles[2];
        var xScale = cellSize[0] / gridSize[0], yScale = cellSize[1] / gridSize[1], zScale = cellSize[2] / gridSize[2];
        var z1 = Math.cos(beta), z2 = (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma)) / Math.sin(gamma), z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);
        var x = [xScale, 0.0, 0.0], y = [Math.cos(gamma) * yScale, Math.sin(gamma) * yScale, 0.0], z = [z1 * zScale, z2 * zScale, z3 * zScale];
        var fromFrac = LA.Matrix4.ofRows([
            [x[0], y[0], z[0], 0],
            [0, y[1], z[1], 0],
            [0, 0, z[2], 0],
            [0, 0, 0, 1.0]
        ]);
        var toFrac = LA.Matrix4.invert(LA.Matrix4.empty(), fromFrac);
        return { toFrac: toFrac, fromFrac: fromFrac, cellDimensions: [xScale, yScale, zScale] };
    }
    Coords.makeSpacegroup = makeSpacegroup;
})(Coords = exports.Coords || (exports.Coords = {}));
var Box;
(function (Box) {
    function zero() {
        return { a: [0, 0, 0], b: [0, 0, 0] };
    }
    Box.zero = zero;
    function shift(box, delta) {
        return { a: Coords.add(box.a, delta), b: Coords.add(box.b, delta) };
    }
    Box.shift = shift;
    function dims(a) {
        return Coords.sub(a.b, a.a);
    }
    Box.dims = dims;
    function intersect(box1, box2) {
        var a = [0.1, 0.1, 0.1];
        var b = [0.1, 0.1, 0.1];
        for (var i = 0; i < 3; i++) {
            var x = box1.a[i], y = box1.b[i];
            var u = box2.a[i], v = box2.b[i];
            if (x > v || y < u)
                return void 0;
            a[i] = Math.max(x, u);
            b[i] = Math.min(y, v);
        }
        return { a: a, b: b };
    }
    Box.intersect = intersect;
    function getBlockMetrics(ctx, coord) {
        var info = ctx.info, header = ctx.header;
        if (info.blockCount.some(function (v, i) { return coord[i] >= v; })) {
            throw Error("Block coordinate exceeds block count.");
        }
        var blockSize = header.blockSize, extent = header.extent;
        var sizeH = extent[0];
        var sizeHK = extent[0] * extent[1];
        var dimensions = Coords.map(function (e, i) { return Math.min(blockSize, e - coord[i] * blockSize); }, extent);
        var N = ctx.header.numDensities;
        var offsets = [
            N * blockSize * dimensions[1] * dimensions[2] * coord[0],
            N * blockSize * extent[0] * dimensions[2] * coord[1],
            N * blockSize * extent[0] * extent[1] * coord[2]
        ];
        var dataOffset = header.dataByteOffset + Data.getElementByteSize(ctx.header) * (offsets[0] + offsets[1] + offsets[2]);
        var box = {
            a: Coords.map(function (c, i) { return ctx.info.dataBox.a[i] + blockSize * c; }, coord),
            b: Coords.map(function (c, i) { return ctx.info.dataBox.a[i] + blockSize * c + dimensions[i]; }, coord)
        };
        return {
            box: box,
            dimensions: dimensions,
            dataOffset: dataOffset
        };
    }
    Box.getBlockMetrics = getBlockMetrics;
    function validate(box) {
        var a = box.a, b = box.b;
        for (var i = 0; i < 3; i++) {
            if (a[i] > b[i]) {
                var t = a[i];
                a[i] = b[i];
                b[i] = t;
            }
        }
        return box;
    }
    function snap(box) {
        return {
            a: Coords.map(function (v) {
                var c = Math.ceil(v);
                if (c - v < 0.0001 /* Delta */)
                    return c;
                return Math.floor(v);
            }, box.a),
            b: Coords.map(function (v) {
                var f = Math.floor(v);
                if (v - f < 0.0001 /* Delta */)
                    return f;
                return Math.ceil(v);
            }, box.b),
        };
    }
    /**
     * Validates intervals and snaps to integer coordinates.
     */
    function normalize(box) {
        return snap(validate(box));
    }
    Box.normalize = normalize;
    /**
     * Map a box from orthogonal to "scaled" fractional coordinates.
     *
     * Axis order is changed to that of the underlying density and
     * the coordinates are snapped to the grid points.
     */
    function map(ctx, box) {
        box = validate(box);
        var _a = ctx.info, toFrac = _a.toFrac, grid = _a.grid;
        var axisOrder = ctx.header.axisOrder;
        var l = box.a, r = box.b;
        var corners = [
            [l[0], l[1], l[2]],
            [r[0], l[1], l[2]],
            [l[0], r[1], l[2]],
            [l[0], l[1], r[2]],
            [r[0], r[1], l[2]],
            [r[0], l[1], r[2]],
            [l[0], r[1], r[2]],
            [r[0], r[1], r[2]],
        ].map(function (c) { return Coords.mapIndices(axisOrder, Coords.transform(c, toFrac)); });
        var mapped = {
            a: corners.reduce(function (m, c) { return Coords.map(function (v, i) { return Math.min(v, m[i]); }, c); }, corners[0]),
            b: corners.reduce(function (m, c) { return Coords.map(function (v, i) { return Math.max(v, m[i]); }, c); }, corners[0])
        };
        return normalize(mapped);
    }
    Box.map = map;
})(Box = exports.Box || (exports.Box = {}));
var Query;
(function (Query) {
    function getBlockHash(coord, blockCount) {
        return (coord[0] + blockCount[0] * (coord[1] + coord[2] * blockCount[1]));
    }
    Query.getBlockHash = getBlockHash;
    function overlapMultiplierRange(a, b, u, v, g, out) {
        var x = Math.ceil((u - b) / g) | 0, y = Math.floor((v - a) / g) | 0;
        if (b + x * g < u)
            x++;
        if (a + y * g > v)
            y--;
        if (x > y)
            return false;
        out[0] = x;
        out[1] = y;
        return true;
    }
    var _tempRange = [0, 0];
    /**
     * Find a 3D integer  range of multipliers of grid sizes that when added map
     * source to target.
     *
     * @example
     *   in 1D
     *   source: [1,2], target: [10,16], grid: 5 => [2,3]
     */
    function findOverlapTransformRange(source, target, grid, out) {
        for (var i = 0; i < 3; i++) {
            if (!overlapMultiplierRange(source.a[i], source.b[i], target.a[i], target.b[i], grid[i], _tempRange))
                return false;
            out.a[i] = _tempRange[0];
            out.b[i] = _tempRange[1];
        }
        return true;
    }
    Query.findOverlapTransformRange = findOverlapTransformRange;
    function getBlockIndex(coord, origin, blockSize) {
        var index = [0, 0, 0];
        for (var i = 0; i < 3; i++) {
            var d = (coord[i] - origin[i]) | 0;
            index[i] = Math.floor(d / blockSize) | 0;
        }
        return index;
    }
    function findBlocksAsymmetric(ctx, region) {
        var box = Box.intersect(ctx.info.dataBox, region);
        if (!box)
            return [];
        var blocks = [];
        var a = getBlockIndex(box.a, ctx.info.dataBox.a, ctx.header.blockSize);
        var b = getBlockIndex(Coords.sub(box.b, [1, 1, 1]), ctx.info.dataBox.a, ctx.header.blockSize);
        for (var k = a[2]; k <= b[2]; k++) {
            for (var j = a[1]; j <= b[1]; j++) {
                for (var i = a[0]; i <= b[0]; i++) {
                    blocks.push([i, j, k]);
                }
            }
        }
        return blocks;
    }
    function findBlocksSymmetric(ctx, region) {
        var _a = ctx.info, dataBox = _a.dataBox, grid = _a.grid, blockCount = _a.blockCount;
        var overlaps = Box.zero();
        if (!findOverlapTransformRange(region, dataBox, grid, overlaps))
            return [];
        var addedBlocks = new Set();
        var blocks = [];
        var delta = [0, 0, 0];
        var a = overlaps.a, b = overlaps.b;
        for (var k = a[2]; k <= b[2]; k++) {
            delta[2] = k * grid[2];
            for (var j = a[1]; j <= b[1]; j++) {
                delta[1] = j * grid[1];
                for (var i = a[0]; i <= b[0]; i++) {
                    delta[0] = i * grid[0];
                    for (var _i = 0, _b = findBlocksAsymmetric(ctx, Box.shift(region, delta)); _i < _b.length; _i++) {
                        var block = _b[_i];
                        var hash = getBlockHash(block, blockCount);
                        if (!addedBlocks.has(hash)) {
                            addedBlocks.add(hash);
                            blocks.push(block);
                        }
                    }
                }
            }
        }
        blocks.sort(function (x, y) {
            for (var i = 2; i >= 0; i--) {
                if (x[i] !== y[i])
                    return x[i] - y[i];
            }
            return 0;
        });
        return blocks;
    }
    function findBlockIndices(ctx, region) {
        if (ctx.info.isAsymmetric)
            return findBlocksAsymmetric(ctx, region);
        return findBlocksSymmetric(ctx, region);
    }
    Query.findBlockIndices = findBlockIndices;
    function fillData1(block, data) {
        var region = Box.intersect(block.box, data.box);
        if (!region)
            return;
        var dataDims = Box.dims(data.box);
        var dataH = dataDims[0];
        var dataHK = dataDims[0] * dataDims[1];
        var _a = Coords.sub(region.a, data.box.a), dH = _a[0], dK = _a[1], dL = _a[2];
        var dataOffset = dH + dK * dataH + dL * dataHK;
        var blockSize = block.dimensions[0] * block.dimensions[1] * block.dimensions[2];
        var blockValues = block.values;
        var blockH = block.dimensions[0];
        var blockHK = block.dimensions[0] * block.dimensions[1];
        var _b = Coords.sub(region.a, block.box.a), bH = _b[0], bK = _b[1], bL = _b[2];
        var blockOffset = bH + bK * blockH + bL * blockHK;
        function fill() {
            var _a = Box.dims(region), cH = _a[0], cK = _a[1], cL = _a[2];
            for (var index = 0; index < data.values.length; index++) {
                var values = data.values[index];
                for (var l = 0; l < cL; l++) {
                    for (var k = 0; k < cK; k++) {
                        for (var h = 0; h < cH; h++) {
                            var v = blockValues[blockSize * index + blockOffset + h + k * blockH + l * blockHK];
                            values[dataOffset + h + k * dataH + l * dataHK] = v;
                        }
                    }
                }
            }
        }
        fill();
    }
    Query.fillData1 = fillData1;
    function fillData(data, block, dataShift) {
        var dataBox = Box.shift(data.box, dataShift);
        var region = Box.intersect(block.box, dataBox);
        if (!region)
            return;
        var dataDims = Box.dims(dataBox);
        var dataH = dataDims[0];
        var dataHK = dataDims[0] * dataDims[1];
        var _a = Coords.sub(region.a, dataBox.a), dH = _a[0], dK = _a[1], dL = _a[2];
        var dataOffset = dH + dK * dataH + dL * dataHK;
        var blockSize = block.dimensions[0] * block.dimensions[1] * block.dimensions[2];
        var blockValues = block.values;
        var blockH = block.dimensions[0];
        var blockHK = block.dimensions[0] * block.dimensions[1];
        var _b = Coords.sub(region.a, block.box.a), bH = _b[0], bK = _b[1], bL = _b[2];
        var blockOffset = bH + bK * blockH + bL * blockHK;
        function fill() {
            var _a = Box.dims(region), cH = _a[0], cK = _a[1], cL = _a[2];
            for (var index = 0; index < data.values.length; index++) {
                var values = data.values[index];
                for (var l = 0; l < cL; l++) {
                    for (var k = 0; k < cK; k++) {
                        for (var h = 0; h < cH; h++) {
                            var v = blockValues[blockSize * index + blockOffset + h + k * blockH + l * blockHK];
                            values[dataOffset + h + k * dataH + l * dataHK] = v;
                        }
                    }
                }
            }
        }
        fill();
    }
    Query.fillData = fillData;
})(Query = exports.Query || (exports.Query = {}));
