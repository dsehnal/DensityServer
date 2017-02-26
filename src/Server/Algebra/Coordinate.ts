/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as LA from '../../Utils/LinearAlgebra'

export interface SpacegroupInfo {
    number: number,
    size: number[],
    angles: number[],
}

export interface Spacegroup extends SpacegroupInfo { toFrac: number[], fromFrac: number[] }

/** Information about a region sampled in fractional coordinates */
export interface GridInfo {
    /** Origin in fractional coords. */
    origin: number[],
    /** Dimensions in fractional coords. */
    dimensions: number[],
    /** Number of samples along each direction (in axis order) */
    samples: number[],
    /** 0 = X, 1 = Y, 2 = Z */    
    axisOrder: number[]
}

/** 
 * Grid domain with the supplied info and "kind". 
 * The "kind" is used so that the TypeScript compiler 
 * can distinguish between different types of grids, 
 * e.g. GridDomain<'Data'>, GridDomain<'Query'>, GridDomain<'Block'>, etc.
 */
export interface GridDomain<K> extends GridInfo { kind: K }

export const enum Space { Cartesian, Fractional, Grid }
export interface Coord<S extends Space> { kind: S, coord: number[] }
export interface Cartesian extends Coord<Space.Cartesian> { }
export interface Fractional extends Coord<Space.Fractional> { spacegroup: Spacegroup }
export interface Grid<K> extends Coord<Space.Grid> { spacegroup: Spacegroup, domain: GridDomain<K> }

/** Constructs spacegroup skew matrix from supplied info */
export function spacegroup(info: SpacegroupInfo): Spacegroup {
    const { number, angles: cellAngles, size: cellSize } = info;

    const alpha = (Math.PI / 180.0) * cellAngles[0];
    const beta = (Math.PI / 180.0) * cellAngles[1];
    const gamma = (Math.PI / 180.0) * cellAngles[2];

    const xScale = cellSize[0], yScale = cellSize[1], zScale = cellSize[2];

    const z1 = Math.cos(beta);
    const z2 = (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma)) / Math.sin(gamma);
    const z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);

    const x = [xScale, 0.0, 0.0];
    const y = [Math.cos(gamma) * yScale, Math.sin(gamma) * yScale, 0.0];
    const z = [z1 * zScale, z2 * zScale, z3 * zScale];

    const fromFrac = LA.Matrix4.ofRows([
        [x[0], y[0], z[0], 0],
        [0, y[1], z[1], 0],
        [0, 0, z[2], 0],
        [0, 0, 0, 1.0]
    ]);
    const toFrac = LA.Matrix4.invert(LA.Matrix4.empty(), fromFrac)!;

    return { ...info, toFrac, fromFrac };
}

export function domain<K>(kind: K, info: GridInfo): GridDomain<K> {
    return { kind, ...info };
}

export function cartesian(coord: number[]): Cartesian {
    return { kind: Space.Cartesian, coord };
}

export function fractional(coord: number[], spacegroup: Spacegroup): Fractional {
    return { kind: Space.Fractional, spacegroup, coord };
}


export function grid<K>(coord: number[], spacegroup: Spacegroup, domain: GridDomain<K>): Grid<K> {
    return { kind: Space.Grid, spacegroup, domain, coord };
}

export function cartesianToFractional(a: Cartesian, spacegroup: Spacegroup): Fractional {
    return fractional(Helpers.transform(a.coord, spacegroup.toFrac), spacegroup);
}

export function fractionalToGrid<K>(a: Fractional, domain: GridDomain<K>, snap: 'floor' | 'ceil'): Grid<K> {
    const { origin, dimensions, samples } = domain;
    const coord = [0, 0, 0];

    for (let i = 0; i < 3; i++) {
        coord[i] = Helpers.snap((a.coord[i] - origin[i]) / dimensions[i] * samples[i], snap);
    }
    return grid(coord, a.spacegroup, domain);
}

export function gridToFractional<K>(a: Grid<K>): Fractional {
    const { origin, dimensions, samples } = a.domain;
    const coord = [0.1, 0.1, 0.1];

    for (let i = 0; i < 3; i++) {
        coord[i] = a.coord[i] * dimensions[i] / samples[i] + origin[i];
    }
    return fractional(coord, a.spacegroup);
}

export function clampGridToSamples<K>(a: Grid<K>): Grid<K> {
    const { samples } = a.domain;
    const coord = [0, 0, 0];

    for (let i = 0; i < 3; i++) {
        coord[i] = Math.min(a.coord[i], samples[i]);
    }
    return { ...a, coord };
}

export function add<S extends Space>(a: Coord<S>, b: Coord<S>): Coord<S> {
    return { ...a, coord: Helpers.add(a.coord, b.coord) };
}

export function sub<S extends Space>(a: Coord<S>, b: Coord<S>): Coord<S> {
    return { ...a, coord: Helpers.sub(a.coord, b.coord) };
}

export function isInDomain<K>(a: Fractional, domain: GridDomain<K>) {
    const coord = a.coord;
    const { dimensions, origin } = domain;
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