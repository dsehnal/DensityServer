/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as LA from './Linear'

export interface SpacegroupInfo {
    number: number,
    size: number[],
    angles: number[],
}

export interface Spacegroup extends SpacegroupInfo { toFrac: number[], fromFrac: number[] }

/** Information about a region sampled in fractional coordinates */
export interface GridInfo {
    /** Origin in fractional coords. */
    origin: Fractional,
    /** Box dimensions in fractional coords. */
    dimensions: Fractional,
    /** Grid delta in fractional coordinates along each axis (in axis order) */
    delta: Fractional,
    /** Sample count of the grid box */
    sampleCount: number[] 
}

/** 
 * Grid domain with the supplied info and "kind". 
 * The "kind" is used so that the TypeScript compiler 
 * can distinguish between different types of grids, 
 * e.g. GridDomain<'Data'>, GridDomain<'Query'>, GridDomain<'Block'>, etc.
 */
export interface GridDomain<K> extends GridInfo { kind: K, sampleVolume: number }

export const enum Space { Cartesian, Fractional, Grid }
export interface Coord<S extends Space> { kind: S, '0': number, '1': number, '2': number, [index: number]: number }
export interface Cartesian extends Coord<Space.Cartesian> { }
export interface Fractional extends Coord<Space.Fractional> {  }
export interface Grid<K> extends Coord<Space.Grid> { domain: GridDomain<K> }

/** Constructs spacegroup skew matrix from supplied info */
export function spacegroup(info: SpacegroupInfo): Spacegroup {
    const { angles: cellAngles, size: cellSize } = info;

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

///////////////////////////////////////////
// CONSTRUCTORS
///////////////////////////////////////////

export function domain<K>(kind: K, info: GridInfo): GridDomain<K> {
    const sc = info.sampleCount;
    return { kind, ...info, sampleVolume: sc[0] * sc[1] * sc[2] };
}

export function cartesian(coord: number[]): Cartesian {
    return { kind: Space.Cartesian, 0: coord[0], 1: coord[1], 2: coord[2] };
}

export function fractional(coord: number[]): Fractional {
    return { kind: Space.Fractional, 0: coord[0], 1: coord[1], 2: coord[2] };
}

export function grid<K>(coord: number[], domain: GridDomain<K>): Grid<K> {
    return { kind: Space.Grid, domain, 0: coord[0], 1: coord[1], 2: coord[2] };
}

export function withCoord<C extends Coord<Space>>(a: C, coord: number[]): C {
    return { ...a as any, 0: coord[0], 1: coord[1], 2: coord[2] };
}

///////////////////////////////////////////
// CONVERSIONS
///////////////////////////////////////////

export function cartesianToFractional(a: Cartesian, spacegroup: Spacegroup, axisOrder: number[]): Fractional {
    const coord = Helpers.transform(a, spacegroup.toFrac);
    return fractional([coord[axisOrder[0]], coord[axisOrder[1]], coord[axisOrder[2]]]);
}

export function fractionalToGrid<K>(a: Fractional, domain: GridDomain<K>, snap: 'floor' | 'ceil' | 'round'): Grid<K> {
    const { origin, delta } = domain;
    const coord = [0, 0, 0];

    for (let i = 0; i < 3; i++) {
        coord[i] = Helpers.snap((a[i] - origin[i]) / delta[i], snap);
    }
    return grid(coord, domain);
}

export function gridToFractional<K>(a: Grid<K>): Fractional {
    const { origin, delta } = a.domain;
    const coord = [0.1, 0.1, 0.1];

    for (let i = 0; i < 3; i++) {
        coord[i] = a[i] * delta[i] + origin[i];
    }
    return fractional(coord);
}

///////////////////////////////////////////
// MISC
///////////////////////////////////////////

export function clampGridToSamples<K>(a: Grid<K>): Grid<K> {
    const { sampleCount } = a.domain;
    const coord = [0, 0, 0];

    for (let i = 0; i < 3; i++) {
        coord[i] = Math.max(Math.min(a[i], sampleCount[i]), 0);
    }
    return { ...a, coord };
}

export function add<S extends Space>(a: Coord<S>, b: Coord<S>): Coord<S> {
    return { ...a, 0: a[0] + b[0], 1: a[1] + b[1], 2: a[2] + b[2] };
}

export function sub<S extends Space>(a: Coord<S>, b: Coord<S>): Coord<S> {
    return { ...a, 0: a[0] - b[0], 1: a[1] - b[1], 2: a[2] - b[2] };
}

/** Maps each grid point to a unique integer */
export function perfectGridHash<K>(a: Grid<K>) {
    const samples = a.domain.sampleCount;
    return a[0] + samples[0] * (a[1] + a[2] * samples[1]);
}

export function sampleCounts(dimensions: Fractional, delta: Fractional, snap: 'floor' | 'ceil' | 'round') {
    return [
        Helpers.snap(dimensions[0] / delta[0], snap), 
        Helpers.snap(dimensions[1] / delta[1], snap), 
        Helpers.snap(dimensions[2] / delta[2], snap)
    ];
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

    export function transform(x: { [index: number]: number }, matrix: number[]) {
        return transformInPlace([x[0], x[1], x[2]], matrix);
    }

    // to prevent floating point rounding errors
    function round(v: number) {
        return Math.round(10000000 * v) / 10000000;
    }

    export function snap(v: number, to: 'floor' | 'ceil' | 'round') {
        switch (to) {
            case 'floor': return Math.floor(round(v)) | 0; 
            case 'ceil': return Math.ceil(round(v)) | 0; 
            case 'round': return Math.round(v) | 0; 
        }
    }
}