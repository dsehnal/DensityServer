/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Utils/File'
import * as BlockFormat from '../Common/BlockFormat'

const FORMAT_VERSION = '1.0.0';

export interface Progress {
    current: number,
    max: number
}

export interface Layer {
    /** numU * numV * blockSize  */
    dimenions: number[],
    buffer: File.ValueArray,
    currentSlice: number,
    isFull: boolean
}

export interface Sampling {
    /** How many values along each axis are collapsed into 1 */
    rate: number,

    samples: number[],

    /** One per channel, same indexing */
    layers: Layer[],

    /** How far along the current sampling is in the buffer */
    bufferPosition: number,

    /** Info about location in the output file, 0 offset is where the header ends */
    byteOffset: number,
    byteSize: number,
    writeByteOffset: number
}

export interface Context {
    file: File.WriteContext, 

    isPeriodic: boolean,
    
    channels: CCP4.Data[],    
    blockSize: number,
    cubeBuffer: Buffer,

    sampling: Sampling[],

    progress: Progress
}

export function makeHeader(ctx: Context): BlockFormat.Header {
    const header = ctx.channels[0].header;
    /** map the grid to the axis order */
    const grid = [header.grid[header.axisOrder[0]], header.grid[header.axisOrder[1]], header.grid[header.axisOrder[2]]];

    function normalize(data: number[]) {
        return [data[0] / grid[0], data[1] / grid[1], data[2] / grid[2]];
    } 

    return {
        version: FORMAT_VERSION,
        valueType: header.mode === CCP4.Mode.Float32 ? BlockFormat.ValueType.Float32 : BlockFormat.ValueType.Int8,
        blockSize: ctx.blockSize,
        axisOrder: header.axisOrder,
        dimensions: normalize(header.extent),
        origin: normalize(header.origin),
        spacegroup: { number: header.spacegroupNumber, size: header.cellSize, angles: header.cellAngles, isPeriodic: ctx.isPeriodic },
        channels: ctx.channels.map(c => ({ 
            name: c.header.name,
            mean: c.header.mean,
            sigma: c.header.sigma,
            min: c.header.min,
            max: c.header.max
        })),
        sampling: ctx.sampling.map(s => ({ 
            byteOffset: s.byteOffset, 
            samples: s.samples 
        }))
    };
}