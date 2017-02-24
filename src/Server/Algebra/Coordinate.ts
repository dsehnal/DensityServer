/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as LA from '../../Utils/LinearAlgebra'

export const enum Space { Cartesian, Fractional, Grid, Block, BlockGrid }

export interface Spacegroup {
    number: number,

    size: number[],
    angles: number[],

    toFrac: number[],
    fromFrac: number[]
}

export interface Domain {
    /** Origin in fractional coords. */
    origin: number[],
    /** Dimensions in fractional coords. */
    dimensions: number[],
    /** Number of samples along each direction (in axis order) */
    samples: number[],
    /** 0 = X, 1 = Y, 2 = Z */    
    axisOrder: number[],

    blockSize: number,
    blockCount: number,
}

export interface Coord<S extends Space> {
    space: S,
    domain: Domain,
    group: Spacegroup,
    coord: number[]
}

export interface Cartesian extends Coord<Space.Cartesian> { }
export interface Fractional extends Coord<Space.Fractional> { }
export interface Grid extends Coord<Space.Grid> { }
export interface Block extends Coord<Space.Block> { }
export interface BlockGrid extends Coord<Space.BlockGrid> { }

export function add<S extends Space>(a: Coord<S>, b: Coord<S>): Coord<S> {
    return { space: a.space, group: a.group, domain: a.domain, coord: Helpers.add(a.coord, b.coord) };
}

export function sub<S extends Space>(a: Coord<S>, b: Coord<S>): Coord<S> {
    return { space: a.space, group: a.group, domain: a.domain, coord: Helpers.sub(a.coord, b.coord) };
}

export function cartesian(coord: number[], group: Spacegroup, domain: Domain): Cartesian {
    return { space: Space.Cartesian, group, domain, coord };
}

export function fractional(coord: number[], group: Spacegroup, domain: Domain): Fractional {
    return { space: Space.Fractional, group, domain, coord };
}

export function block(coord: number[], group: Spacegroup, domain: Domain): Block {
    return { space: Space.Block, group, domain, coord };
}

export function grid(coord: number[], group: Spacegroup, domain: Domain): Grid {
    return { space: Space.Grid, group, domain, coord };
}

export function cartesianToFractional(a: Cartesian): Fractional {
    return { space: Space.Fractional, group: a.group, domain: a.domain, coord: Helpers.mapIndices(a.domain.axisOrder, Helpers.transform(a.coord, a.group.toFrac)) };
}

export function fractionalToGrid(a: Fractional, snap: 'floor' | 'ceil'): Grid {
    const data = a.domain;
    const coord = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        coord[i] = Helpers.snap((a.coord[i] - data.origin[i]) * data.samples[i], snap);
    }
    return { space: Space.Grid, group: a.group, domain: a.domain, coord };
}

export function blockToFractional(a: Block): Fractional {
    const data = a.domain;
    const coord = [0.1, 0.1, 0.1];
    for (let i = 0; i < 3; i++) {
        coord[i] = a.coord[i] / data.samples[i] + data.origin[i];
    }
    return { space: Space.Fractional, group: a.group, domain: a.domain, coord };
}

export function fractionalToBlock(a: Fractional, snap: 'floor' | 'ceil'): Block {
    const data = a.domain;
    const coord = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        const c = Helpers.snap((a.coord[i] - data.origin[i]) * data.samples[i], snap);
        coord[i] = Math.floor(c / data.blockSize) | 0;
    }
    return { space: Space.Block, group: a.group, domain: a.domain, coord };
}

export function toBlockGrid(a: Fractional, snap: 'floor' | 'ceil'): BlockGrid {
    const data = a.domain;
    const coord = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        const c = Helpers.snap((a.coord[i] - data.origin[i]) * data.samples[i], snap);
        coord[i] = Math.floor(c % data.blockSize) | 0;
    }
    return { space: Space.BlockGrid, group: a.group, domain: a.domain, coord };
}

export function isInDataRegion(a: Fractional) {
    const coord = a.coord;
    const { dimensions, origin } = a.domain;
    for (let i = 0; i < 3; i++) {
        const c = coord[i] - origin[i];
        if (c < 0 || c > dimensions[i]) return false;
    }
    return true;
}

module Helpers {
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

    export function map(f: (x: number, i: number) => number, a: number[]) {
        return [f(a[0], 0), f(a[1], 1), f(a[2], 2)];
    }

    export function add(a: number[], b: number[]) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
    }

    export function sub(a: number[], b: number[]) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    export function mapIndices(map: number[], coord: number[]) {
        return [coord[map[0]], coord[map[1]], coord[map[2]]];
    }

    export function snap(v: number, to: 'floor' | 'ceil') {
        return to === 'floor' ? Math.floor(v) | 0 : Math.ceil(v);
    }
}