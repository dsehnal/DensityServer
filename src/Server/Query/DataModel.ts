/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as DataFormat from '../../Common/DataFormat'
import * as Coords from '../Algebra/Coordinate'
import * as Box from '../Algebra/Box'
import * as CIF from '../../lib/CIFTools'

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

export type QueryOutputStream = CIF.OutputStream & { end: () => void }

export namespace QueryParamsBox {
    export type Cartesian = { kind: 'Cartesian', a: Coords.Cartesian, b: Coords.Cartesian }
    export type Fractional = { kind: 'Fractional', a: Coords.Fractional, b: Coords.Fractional }
    export type Cell = { kind: 'Cell' }
}
export type QueryParamsBox = QueryParamsBox.Cartesian | QueryParamsBox.Fractional | QueryParamsBox.Cell

export interface QueryParams {
    sourceFilename: string,
    sourceId: string,
    asBinary: boolean,
    box: QueryParamsBox,
    precision: number,
    forcedSamplingLevel?: number
}

export type QueryBlock = { coord: Coords.Grid<'Block'>, offsets: Coords.Fractional[] }

export interface QuerySamplingInfo {
    sampling: Sampling,
    fractionalBox: Box.Fractional,
    gridDomain: Coords.GridDomain<'Query'>,
    blocks: QueryBlock[]
}

export interface QueryContext {
    guid: string,
    serialNumber: number,
    data: DataContext,
    params: QueryParams,    
    samplingInfo: QuerySamplingInfo,
    result: QueryResult
}

export interface QueryResult {
    isEmpty: boolean,
    error?: string,
    values?: DataFormat.ValueArray[]
}