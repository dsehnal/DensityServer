/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as DataFormat from '../Common/DataFormat'

const FORMAT_VERSION = '1.0.0';

export interface Progress {
    current: number,
    max: number
}

export interface BlockBuffer {
    values: DataFormat.ValueArray[],
    buffers: Buffer[],
    slicesWritten: number,
    isFull: boolean
}

export interface DownsamplingBuffer {
    /** dimensions (sampleCount[1], sampleCount[0] / 2, 1) */
    downsampleX: DataFormat.ValueArray,
    /** dimensions (5, sampleCount[0] / 2, sampleCount[1] / 2) */
    downsampleXY: DataFormat.ValueArray,

    slicesWritten: number,
    startSliceIndex: number
}

export interface Sampling {
    /** How many values along each axis are collapsed into 1 */
    rate: number,

    sampleCount: number[],

    /** One per channel, same indexing */
    blocks: BlockBuffer,
    downsampling?: DownsamplingBuffer[],

    /** Info about location in the output file, 0 offset is where the header ends */
    byteOffset: number,
    byteSize: number,
    /** where to write the next block relative to the byteoffset */
    writeByteOffset: number,  

}

export interface Context {
    file: number, 

    /** Periodic are x-ray density files that cover the entire grid */
    isPeriodic: boolean,
    
    channels: CCP4.Data[],    
    valueType: DataFormat.ValueType,
    blockSize: number,    
    /** Able to store channels.length * blockSize^3 values. */
    cubeBuffer: Buffer, 
    litteEndianCubeBuffer: Buffer,   

    sampling: Sampling[],
    dataByteOffset: number,
    totalByteSize: number,

    progress: Progress
}

export function createHeader(ctx: Context): DataFormat.Header {
    const header = ctx.channels[0].header;
    const grid = header.grid;

    function normalize(data: number[]) {
        return [data[0] / grid[0], data[1] / grid[1], data[2] / grid[2]];
    } 

    return {
        formatVersion: FORMAT_VERSION,
        valueType: header.mode === CCP4.Mode.Float32 ? DataFormat.ValueType.Float32 : DataFormat.ValueType.Int8,
        blockSize: ctx.blockSize,
        axisOrder: header.axisOrder,
        origin: normalize(header.origin),
        dimensions: normalize(header.extent),
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
            rate: s.rate,
            sampleCount: s.sampleCount 
        }))
    };
}

export function samplingBlockCount(sampling: Sampling, blockSize: number) {
    return sampling.sampleCount.map(c => Math.ceil(c / blockSize)).reduce((c, v) => c * v, 1);
}