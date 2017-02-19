/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from '../Utils/File'

export const enum FormatId { Float32 = 0, Int8 = 1 }

export interface Header {
    numDensities: number,
    formatId: FormatId,
    axisOrder: number[],
    gridSize: number[],
    blockSize: number,
    extent: number[],
    origin: number[],
    spacegroupNumber: number,
    cellSize: number[],
    cellAngles: number[],
    means: number[],
    sigmas: number[],
    minimums: number[],
    maximums: number[],
    names: string[],

    dataByteOffset: number
}

export function getElementByteSize(header: Header) {
    if (header.formatId === FormatId.Float32) return 4;
    return 1;
}

export interface Box {
    a: number[],
    b: number[]
}

export interface Info {
    blockCount: number[],
    cellDimensions: number[],    
    
    isAsymmetric: boolean,

    /**
     * Grid in axis order.
     */
    grid: number[],

    dataBox: Box,

    /**
     * Transform from orthogonal to the scaled fraction coordinates
     */
    toFrac: number[],

    fromFrac: number[]
}

export interface Context {
    file: number,
    header: Header,
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
    values: Float32Array[]
}

export interface QueryResult {
    params: QueryParams,
    error?: string,
    data?: { ctx: Context, result?: QueryData }
}