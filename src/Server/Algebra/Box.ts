/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CA from './Coordinate'

export interface Box<S extends CA.Space> { a: CA.Coord<S>, b: CA.Coord<S> }

export type Cartesian = Box<CA.Space.Cartesian>
export type Fractional = Box<CA.Space.Fractional>
export type Grid = Box<CA.Space.Grid>
export type Block = Box<CA.Space.Block>
export type BlockGrid = Box<CA.Space.BlockGrid>

export function cartesianToFractional(box: Cartesian): Fractional {
    return { a: CA.cartesianToFractional(box.a), b: CA.cartesianToFractional(box.b) }
}

export function cartesianToGrid(box: Fractional): Grid {
    return { a: CA.fractionalToGrid(box.a, 'floor'), b: CA.fractionalToGrid(box.b, 'ceil') }
}

export function shift<S extends CA.Space>(box: Box<S>, offset: CA.Coord<S>): Box<S> {
    return { a: CA.add(box.a, offset), b: CA.add(box.b, offset) };
}

export function areIntersecting<S extends CA.Space>(a: Box<S>, b: Box<S>) {
    return false;
}

export function intersect<S extends CA.Space>(a: Box<S>, b: Box<S>): Box<S> {
    throw 'implement me';
}

// export function dimensions<C extends CA.Any>(box: Box<C>): C {
//     return CA.sub(box.b, box.a);
// }
