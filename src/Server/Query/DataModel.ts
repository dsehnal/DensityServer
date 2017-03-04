/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as DataFormat from '../../Common/DataFormat'
import * as Coords from '../Algebra/Coordinate'
import * as Box from '../Algebra/Box'

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

export interface DataContext {
    file: number,
    header: DataFormat.Header,
    spacegroup: Coords.Spacegroup,
    dataBox: Box.Fractional,
    sampling: Sampling[]
}

export interface BlockData {
    sampleCount: number[],
    values: DataFormat.ValueArray
}

//////////////////////////////////////
// QUERY
//////////////////////////////////////

export interface QueryParams {
    sourceFilename: string,
    sourceId: string,
    asBinary: boolean,
    box: Box.Cartesian | Box.Fractional,
}

export interface QueryContext {
    guid: string,
    serialNumber: number,
    data: DataContext,
    params: QueryParams,
    sampling: Sampling,
    fractionalBox: Box.Fractional,
    gridDomain: Coords.GridDomain<'Query'>,
    result: QueryResult
}

export interface QueryResult {
    isEmpty: boolean,
    error?: string,
    values?: DataFormat.ValueArray[]
}