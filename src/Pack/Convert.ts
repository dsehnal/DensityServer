/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Utils/File'
import * as Writer from './Writer'

export async function processLayer(ctx: Writer.Context) {
    const { extent } = ctx.sources[0].header;
    const { readHeight, valuesOffset } = ctx.sources[0].layer;

    for (let v = 0; v < ctx.blockCounts[0]; v++) {
        for (let u = 0; u < ctx.blockCounts[1]; u++) {
            for (let src of ctx.sources) {
                let numBytes = Writer.fillCube(ctx, src.layer.buffer.values, valuesOffset, u, v, readHeight);
                await File.write(ctx.file, ctx.cubeBuffer, numBytes);
                Writer.updateProgress(ctx.progress, 1);
            }
        }
    }
} 

export async function createContext(filename: string, progress: Writer.GlobalProgress, sources: CCP4.Data[], blockSize: number): Promise<Writer.Context> {
    const samples = sources[0].header.extent;
    const blockCounts = [Math.ceil(samples[0] / blockSize) | 0, Math.ceil(samples[1] / blockSize) | 0, Math.ceil(samples[2] / blockSize) | 0];
    progress.max += blockCounts[0] * blockCounts[1] * blockCounts[2] * sources.length;

    return {
        file: await File.createFile(filename),
        sigmasOffset: 0,
        sources,
        blockHeader: void 0,
        progress,

        blockSize, 
        samples,
        blockCounts: [Math.ceil(samples[0] / blockSize) | 0, Math.ceil(samples[1] / blockSize) | 0, Math.ceil(samples[2] / blockSize) | 0],
        cubeBuffer: new Buffer(new ArrayBuffer(sources[0].layer.buffer.elementByteSize * blockSize * blockSize * blockSize))
    };
}