/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Utils/File'
import * as BlockWriter from './BlockWriter'

export interface Context extends BlockWriter.Context {  

    /** Holds the number of slices that need to be downsamples. */
    downsampleBuffer: File.ValueArray[],

    /** Downsamples slices for each source. It's a buffer with "blockSize height" */
    downsampledSlices: File.ValueArray[],

    /** How many values along each axis to collapse into 1. */
    sampleRate: number,

    /** Number of input slices that have been processed. */
    currentSlice: number,

    /** Number of input slices that are available. */
    endSlice: number
}

export async function createContext(filename: string, progress: BlockWriter.GlobalProgress, sources: CCP4.Data[], blockSize: number, sampleRate: number) {
    const extent = sources[0].header.extent;
    const sampleCounts = [Math.ceil(extent[0] / sampleRate), Math.ceil(extent[1] / sampleRate), Math.ceil(extent[2] / sampleRate)];
    const downsampleSliceSize = sampleCounts[0] * sampleCounts[1] * blockSize;

    const downsampleSliceRate = Math.ceil((sampleCounts[2] * sampleRate / extent[2]) * sampleRate);
    const downsampleBufferSize = extent[0] * extent[1] * downsampleSliceRate;

    // 2 * Math.ceil(sampleRate * sampleCounts[0] / extent[0])

    return <Context>{
        file: await File.createFile(filename),
        sigmasOffset: 0,
        sources,
        progress,

        blockSize, 
        sampleCounts,
        blockCounts: [Math.ceil(sampleCounts[0] / blockSize) | 0, Math.ceil(sampleCounts[1] / blockSize) | 0, Math.ceil(sampleCounts[2] / blockSize) | 0],
        cubeBuffer: new Buffer(new ArrayBuffer(sources[0].slice.data.elementByteSize * blockSize * blockSize * blockSize)),

        //downsampledBuffer: sources.map(_ => new Float32Array(downsampleBufferSize)),
        //downsampledSlices: sources.map(_ => new Float32Array(downsampleSliceSize)),
        sampleRate,
        currentSlice: 0,
        endSlice: 0      
    }
}

function downsampleSlice(ctx: Context, index: number) {
    //const { sliceHeight } = ctx.sources[index].slice;
    const numSlices = ctx.currentSlice;

    return numSlices;
            
}

export function nextSlice(ctx: Context) {
    ctx.endSlice += ctx.sources[0].slice.blockSize;
}

export async function processSlice(ctx: Context) {

}