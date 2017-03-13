/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as LA from './linear'

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

    return { angles: info.angles, size: info.size, number: info.number, toFrac, fromFrac };
}

///////////////////////////////////////////
// CONSTRUCTORS
///////////////////////////////////////////

export function domain<K>(kind: K, info: GridInfo): GridDomain<K> {
    const sc = info.sampleCount;
    return { 
        kind, 
        delta: info.delta, 
        dimensions: info.dimensions, 
        origin: info.origin, 
        sampleCount: info.sampleCount, 
        sampleVolume: sc[0] * sc[1] * sc[2]
    };
}

export function cartesian(x: number, y: number, z: number): Cartesian {
    return { 0: x, 1: y, 2: z, kind: Space.Cartesian };
}

export function fractional(x: number, y: number, z: number): Fractional {
    return { 0: x, 1: y, 2: z, kind: Space.Fractional };
}

export function grid<K>(domain: GridDomain<K>, x: number, y: number, z: number): Grid<K> {
    return { 0: x, 1: y, 2: z, kind: Space.Grid, domain };
}

export function withCoord<C extends (Coord<Space> | Grid<any>)>(a: C, x: number, y: number, z: number): C {
    switch (a.kind) {
        case Space.Cartesian: return cartesian(x, y, z) as C;
        case Space.Fractional: return fractional(x, y, z) as C;
        case Space.Grid: return grid((a as Grid<any>).domain, x, y, z) as C;
    }
}

export function clone<C extends (Coord<Space> | Grid<any>)>(a: C): C {
    return withCoord(a, a[0], a[1], a[2]);
}

///////////////////////////////////////////
// CONVERSIONS
///////////////////////////////////////////

export function cartesianToFractional(a: Cartesian, spacegroup: Spacegroup): Fractional {
    const coord = Helpers.transform(a, spacegroup.toFrac);
    return fractional(coord[0], coord[1], coord[2]);
}

export function fractionalToGrid<K>(a: Fractional, domain: GridDomain<K>, snap: 'bottom' | 'top'): Grid<K> {
    const { origin, delta } = domain;
    const coord = grid(domain, 0.1, 0.1, 0.1);
    for (let i = 0; i < 3; i++) {
        coord[i] = Helpers.snap((a[i] - origin[i]) / delta[i], snap);
    }
    return coord;
}

export function gridToFractional<K>(a: Grid<K>): Fractional {
    const { origin, delta } = a.domain;
    const coord = fractional(0.1, 0.1, 0.1);
    for (let i = 0; i < 3; i++) {
        coord[i] = a[i] * delta[i] + origin[i];
    }
    return coord;
}

///////////////////////////////////////////
// MISC
///////////////////////////////////////////

export function clampGridToSamples<K>(a: Grid<K>): Grid<K> {
    const { sampleCount } = a.domain;
    const coord = withCoord(a, 0, 0, 0);
    for (let i = 0; i < 3; i++) {
        if (a[i] < 0) coord[i] = 0;
        else if (a[i] > sampleCount[i]) coord[i] = sampleCount[i];
        else coord[i] = a[i];
    }
    return coord;
}

export function add<S extends Space>(a: Coord<S>, b: Coord<S>): Coord<S> {
    return withCoord(a, a[0] + b[0], a[1] + b[1], a[2] + b[2]);
}

export function sub<S extends Space>(a: Coord<S>, b: Coord<S>): Coord<S> {
    return withCoord(a, a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function invert<S extends Space>(a: Coord<S>): Coord<S> {
    return withCoord(a, -a[0], -a[1], -a[2]);
}

/** Maps each grid point to a unique integer */
export function linearGridIndex<K>(a: Grid<K>) {
    const samples = a.domain.sampleCount;
    return a[0] + samples[0] * (a[1] + a[2] * samples[1]);
}

export function gridMetrics(dimensions: { [i: number]: number }) {
    return {
        sizeX: dimensions[0],
        sizeXY: dimensions[0] * dimensions[1],
        sizeXYZ: dimensions[0] * dimensions[1] * dimensions[2]
    };
}

export function sampleCounts(dimensions: Fractional, delta: Fractional) {
    return [
        Helpers.snap(dimensions[0] / delta[0], 'top'), 
        Helpers.snap(dimensions[1] / delta[1], 'top'), 
        Helpers.snap(dimensions[2] / delta[2], 'top')
    ];
}

// to prevent floating point rounding errors
export function round(v: number) {
    return Math.round(10000000 * v) / 10000000;
}

module Helpers {
    import applyTransform = LA.Matrix4.transformVector3;
    export function transform(x: { [index: number]: number }, matrix: number[]) {
        return applyTransform([0.1, 0.1, 0.1], x, matrix);
    }

    export function snap(v: number, to: 'bottom' | 'top') {
        switch (to) {
            case 'bottom': return Math.floor(round(v)) | 0; 
            case 'top': return Math.ceil(round(v)) | 0; 
        }
    }
}