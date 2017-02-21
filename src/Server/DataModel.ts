/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as BlockFormat from '../Common/BlockFormat'

export interface Box {
    a: number[],
    b: number[]
}

export interface Info {
    blockCount: number[],        
    isAsymmetric: boolean,
    voxelSize: number[],
    dataBox: Box,

    /**
     * Transform from orthogonal to the scaled fraction coordinates
     */
    toFrac: number[],

    fromFrac: number[]
}

export interface Context {
    file: number,
    header: BlockFormat.Header,
    info: Info
}

export interface MultiBlock {
    coord: number[],
    blockCount: number[],
    dimensions: number[],
    box: Box,
    values: Float32Array
}

export interface QueryParams {
    asBinary: boolean,
    source: string,
    id: string,
    box: Box,
    guid: string
}

export interface QueryData {
    box: Box,
    samples: number[],
    values: Float32Array[]
}

export interface QueryResult {
    params: QueryParams,
    error?: string,
    data?: { ctx: Context, result?: QueryData }
}