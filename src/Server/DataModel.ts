/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as DataFormat from '../Common/DataFormat'
import * as Coords from './Algebra/Coordinate'
import * as Box from './Algebra/Box'

//////////////////////////////////////
// DATA
//////////////////////////////////////

export interface Sampling {
    index: number,
    rate: number,
    byteOffset: number,
    dataDomain: Coords.GridDomain<'Data'>,
    blockDomain: Coords.GridDomain<'Block'>
}

export interface Coordinates {
    spacegroup: Coords.Spacegroup,
    /** X = 0, Z = 2, fastest to slowest moving, same as in CCP4 format */
    axisOrder: number[],        
    dataBox: Box.Fractional,
    sampling: Sampling[]
}

export interface DataContext {
    file: number,
    header: DataFormat.Header,
    coordinates: Coordinates
}

//////////////////////////////////////
// QUERY
//////////////////////////////////////

export interface QueryParams {
    asBinary: boolean,
    source: string,
    id: string,
    box: Box.Cartesian,
    guid: string
}

export interface QueryContext {
    data: DataContext,
    params: QueryParams,
    samplingIndex: number,
    box: Box.Fractional,
    domain: Coords.GridDomain<'Query'>
}

export interface QueryResult {
    context: QueryContext,
    isEmpty: boolean,
    error?: string,
    values?: DataFormat.ValueArray[]
}

//////////////////////////////////////
// MISC
//////////////////////////////////////

export interface MultiBlock {
    coord: number[],
    dimensions: number[],
    box: Box.Fractional,
    values: Float32Array
}