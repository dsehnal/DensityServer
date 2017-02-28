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

export function shift<C extends Coords.Coord<S>, S extends Coords.Space>(box: Box<C>, offset: C): Box<C> {
    return { a: Coords.add(box.a, offset), b: Coords.add(box.b, offset) } as Box<C>;
}

export function clampGridToSamples<C extends Coords.Grid<K>, K>(box: Box<C>): Box<C> {
    return { a: Coords.clampGridToSamples(box.a), b: Coords.clampGridToSamples(box.b) } as Box<C>;
}

export function bounding<C extends Coords.Coord<Coords.Space>>(xs: C[]): Box<C> {
    let a = [...xs[0].coord];
    let b = [...xs[1].coord];

    for (const x of xs) {
        for (let i = 0; i < 3; i++) {
            a[i] = Math.min(a[i], x.coord[i]);
            b[i] = Math.max(b[i], x.coord[i]);
        }
    }

    return { a: Coords.withCoord(xs[0], a), b: Coords.withCoord(xs[0], b) }
}

export function areIntersecting<C extends Coords.Coord<S>, S extends Coords.Space>(box1: Box<C>, box2: Box<C>) {
    for (let i = 0; i < 3; i++) {
        let x = box1.a.coord[i], y = box1.b.coord[i];
        let u = box2.a.coord[i], v = box2.b.coord[i];
        if (x > v || y < u) return false;
    }
    return true;
}

export function intersect<C extends Coords.Coord<S>, S extends Coords.Space>(box1: Box<C>, box2: Box<C>): Box<C> | undefined {
    let a = [0.1, 0.1, 0.1];
    let b = [0.1, 0.1, 0.1];
    
    for (let i = 0; i < 3; i++) {
        let x = box1.a.coord[i], y = box1.b.coord[i];
        let u = box2.a.coord[i], v = box2.b.coord[i];
        if (x > v || y < u) return void 0;
        a[i] = Math.max(x, u);
        b[i] = Math.min(y, v);
    }
    return { a: Coords.withCoord(box1.a, a), b: Coords.withCoord(box1.a, b) };
}

export function dimensions<C extends Coords.Coord<S>, S extends Coords.Space>(box: Box<C>): number[] {
    return Coords.sub(box.b, box.a).coord;
}

export function volume<C extends Coords.Coord<S>, S extends Coords.Space>(box: Box<C>): number {
    return dimensions(box).reduce((a, v) => a * v, 1);
}