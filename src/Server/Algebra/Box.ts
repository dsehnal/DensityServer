/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CA from './Coordinate'

export interface Box<C extends CA.Coord<CA.Space>> { a: C, b: C }

export interface Cartesian extends Box<CA.Cartesian> { }
export interface Fractional extends Box<CA.Fractional> { }
export interface Grid<K> extends Box<CA.Grid<K>> { }

export function cartesianToFractional(box: Cartesian, spacegroup: CA.Spacegroup): Fractional {
    return { a: CA.cartesianToFractional(box.a, spacegroup), b: CA.cartesianToFractional(box.b, spacegroup) }
}

export function fractionalToGrid<K>(box: Fractional, domain: CA.GridDomain<K>): Grid<K> {
    return { a: CA.fractionalToGrid(box.a, domain, 'floor'), b: CA.fractionalToGrid(box.b, domain, 'ceil') }
}

export function shift<C extends CA.Coord<S>, S extends CA.Space>(box: Box<C>, offset: C): Box<C> {
    return { a: CA.add(box.a, offset), b: CA.add(box.b, offset) } as Box<C>;
}

export function areIntersecting<C extends CA.Coord<S>, S extends CA.Space>(a: Box<C>, b: Box<C>) {
    return false;
}

export function intersect<C extends CA.Coord<S>, S extends CA.Space>(a: Box<C>, b: Box<C>): Box<C> {
    throw 'implement me';
}

// export function dimensions<C extends CA.Any>(box: Box<C>): C {
//     return CA.sub(box.b, box.a);
// }
