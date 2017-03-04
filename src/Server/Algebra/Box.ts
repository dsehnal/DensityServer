/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Coords from './Coordinate'

export interface Box<C extends Coords.Coord<Coords.Space>> { a: C, b: C }

export interface Cartesian extends Box<Coords.Cartesian> { }
export interface Fractional extends Box<Coords.Fractional> { }
export interface Grid<K> extends Box<Coords.Grid<K>> { }

export function cartesianToFractional(box: Cartesian, spacegroup: Coords.Spacegroup, axisOrder: number[]): Fractional {
    return { 
        a: Coords.cartesianToFractional(box.a, spacegroup, axisOrder), 
        b: Coords.cartesianToFractional(box.b, spacegroup, axisOrder)
    }
}

export function fractionalToGrid<K>(box: Fractional, domain: Coords.GridDomain<K>): Grid<K> {
    return { a: Coords.fractionalToGrid(box.a, domain, 'floor'), b: Coords.fractionalToGrid(box.b, domain, 'ceil') }
}

export function fractionalRoundToGrid<K>(box: Fractional, domain: Coords.GridDomain<K>): Grid<K> {
    return { a: Coords.fractionalToGrid(box.a, domain, 'round'), b: Coords.fractionalToGrid(box.b, domain, 'round') }
}

export function shift<C extends Coords.Coord<S>, S extends Coords.Space>(box: Box<C>, offset: C): Box<C> {
    return { a: Coords.add(box.a, offset), b: Coords.add(box.b, offset) } as Box<C>;
}

export function clampGridToSamples<C extends Coords.Grid<K>, K>(box: Box<C>): Box<C> {
    return { a: Coords.clampGridToSamples(box.a), b: Coords.clampGridToSamples(box.b) } as Box<C>;
}

export function fractionalFromBlock(block: Coords.Grid<'Block'>): Fractional {
    const { domain } = block;
    const a = Coords.gridToFractional(block);
    const b = Coords.add(a, domain.delta);
    for (let i = 0; i < 3; i++) {
        b[i] = Math.min(b[i], domain.origin[i] + domain.dimensions[i]);
    }
    return { a, b }
}

export function bounding<C extends Coords.Coord<Coords.Space>>(xs: C[]): Box<C> {
    let a = [xs[0][0], xs[0][1], xs[0][2]];
    let b = [xs[0][0], xs[0][1], xs[0][2]];

    for (const x of xs) {
        for (let i = 0; i < 3; i++) {
            a[i] = Math.min(a[i], x[i]);
            b[i] = Math.max(b[i], x[i]);
        }
    }

    return { a: Coords.withCoord(xs[0], a), b: Coords.withCoord(xs[0], b) }
}

export function areIntersecting<C extends Coords.Coord<S>, S extends Coords.Space>(box1: Box<C>, box2: Box<C>) {
    for (let i = 0; i < 3; i++) {
        let x = box1.a[i], y = box1.b[i];
        let u = box2.a[i], v = box2.b[i];
        if (x > v || y < u) return false;
    }
    return true;
}

export function intersect<C extends Coords.Coord<S>, S extends Coords.Space>(box1: Box<C>, box2: Box<C>): Box<C> | undefined {
    let a = [0.1, 0.1, 0.1];
    let b = [0.1, 0.1, 0.1];
    
    for (let i = 0; i < 3; i++) {
        let x = box1.a[i], y = box1.b[i];
        let u = box2.a[i], v = box2.b[i];
        if (x > v || y < u) return void 0;
        a[i] = Math.max(x, u);
        b[i] = Math.min(y, v);
    }
    return { a: Coords.withCoord(box1.a, a), b: Coords.withCoord(box1.a, b) };
}

export interface XX extends Array<number> { [i: number]: number, length: number };
export let xx: XX = 0 as any;


export function dimensions<C extends Coords.Coord<S>, S extends Coords.Space>(box: Box<C>): number[] {
    return [box.b[0] - box.a[0], box.b[1] - box.a[1], box.b[2] - box.a[2]];
}

export function volume<C extends Coords.Coord<S>, S extends Coords.Space>(box: Box<C>): number {
    return dimensions(box).reduce((a, v) => a * v, 1);
}