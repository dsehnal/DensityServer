/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Utils/File'
import * as BlockWriter from './BlockWriter'

export async function processSlice(ctx: BlockWriter.Context) {
    for (let v = 0; v < ctx.blockCounts[0]; v++) {
        for (let u = 0; u < ctx.blockCounts[1]; u++) {
            for (let src of ctx.sources) {
                let numBytes = BlockWriter.fillCube(ctx, src.slice.data.values, u, v, src.slice.height);
                await File.write(ctx.file, ctx.cubeBuffer, numBytes);
                BlockWriter.updateProgress(ctx.progress, 1);
            }
        }
    }
} 

export async function createContext(filename: string, progress: BlockWriter.GlobalProgress, sources: CCP4.Data[], blockSize: number) {
    const sampleCounts = sources[0].header.extent;
    const blockCounts = [Math.ceil(sampleCounts[0] / blockSize) | 0, Math.ceil(sampleCounts[1] / blockSize) | 0, Math.ceil(sampleCounts[2] / blockSize) | 0];
    progress.max += blockCounts[0] * blockCounts[1] * blockCounts[2] * sources.length;

    return <BlockWriter.Context>{
        file: await File.createFile(filename),
        sigmasOffset: 0,
        sources,
        progress,

        blockSize, 
        sampleCounts,
        blockCounts: [Math.ceil(sampleCounts[0] / blockSize) | 0, Math.ceil(sampleCounts[1] / blockSize) | 0, Math.ceil(sampleCounts[2] / blockSize) | 0],
        cubeBuffer: new Buffer(new ArrayBuffer(sources[0].slice.data.elementByteSize * blockSize * blockSize * blockSize))
    };
}