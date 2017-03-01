/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as Data from './DataModel'
import * as File from '../Utils/File'
import * as BlockFormat from '../Common/BlockFormat'

function getSamplingRates(samples: number[], blockSize: number) {
    return [1, 2, 4];
}

function createBuffer(type: BlockFormat.ValueType, size: number): File.ValueArray {
    throw '';
}

function createBlockLayer(sampleCount: number[], blockSize: number, valueType: BlockFormat.ValueType): Data.BlockLayer {
    return {
        dimenions: [sampleCount[0], sampleCount[1], blockSize],
        buffer: createBuffer(valueType, sampleCount[0] * sampleCount[1] * blockSize),
        currentSlice: 0,
        isFull: false
    };
}

function createSampling(valueType: BlockFormat.ValueType, numChannels: number, baseSampleCount: number[], blockSize: number, rate: number): Data.Sampling {
    const sampleCount = baseSampleCount.map(s => Math.ceil(s / rate));

    return {
        rate,
        sampleCount,
        blockLayers: new Array(numChannels).map(() => createBlockLayer(sampleCount, blockSize, valueType)),
        
        dataSliceIndex: 0,
        byteOffset: 0,
        byteSize: numChannels * sampleCount[0] * sampleCount[1] * sampleCount[2] * BlockFormat.getValueByteSize(valueType),
        writeByteOffset: 0
    }
}

export async function createContext(filename: string, channels: CCP4.Data[], blockSize: number, isPeriodic: boolean): Promise<Data.Context> {
    const header = channels[0].header;
    const rates = getSamplingRates(channels[0].header.extent, blockSize);
    const valueType = CCP4.getValueType(header); 
    
    // The data can be periodic iff the extent is the same as the grid.
    if (header.grid.some((v, i) => v !== header.extent[i])) isPeriodic = false;
    
    const ctx: Data.Context = {
        file: await File.createFile(filename),
        isPeriodic,
        channels,
        blockSize,
        cubeBuffer: new Buffer(new ArrayBuffer(blockSize * blockSize * blockSize * BlockFormat.getValueByteSize(valueType))),
        sampling: rates.map(r => createSampling(valueType, channels.length, header.extent, blockSize, r)),
        kSampling: [],
        dataByteOffset: 0,
        totalByteSize: 0,
        progress: { current: 0, max: 0 }
    };
    
    // Create kSampling index.
    ctx.kSampling.push([]);
    ctx.kSampling.push([ctx.sampling[0]]);
    const addedSamplings = new Set<number>();

    for (let k = 2; k < rates[rates.length - 1]; k++) {
        const current: Data.Sampling[] = [];
        ctx.kSampling.push(current);
        for (const s of ctx.sampling) {
            if (addedSamplings.has(s.rate) || s.rate % k !== 0) continue;
            addedSamplings.add(s.rate);
            current.push(s);
        }
    }

    let byteOffset = 0;
    for (const s of ctx.sampling) {
        // Max progress = total number of blocks that need to be written.
        ctx.progress.max += Data.samplingBlockCount(s, blockSize);
        s.byteOffset = byteOffset;
        byteOffset += s.byteSize;
    }

    ctx.dataByteOffset = 4 + BlockFormat.encodeHeader(Data.createHeader(ctx)).byteLength;
    ctx.totalByteSize = ctx.dataByteOffset + byteOffset;

    return ctx;
}

export async function processLayer(ctx: Data.Context, isLast: boolean) {
    const { kSampling } = ctx;
    advanceSampling1(kSampling[1][0], ctx);
    for (let k = 2; k < kSampling.length; k++) {
        if (!kSampling[k].length) continue;
        advanceSamplingK(k, kSampling[k], ctx);
    }

    await writeCubes(ctx, isLast);
}

/** Advances sampling rate 1 */
function advanceSampling1(sampling: Data.Sampling, ctx: Data.Context) {

}

/** Advances sampling rate K */
function advanceSamplingK(K: number, sampling: Data.Sampling[], ctx: Data.Context) {

}

async function writeLayer(layers: Data.BlockLayer) {

}

async function writeCubes(ctx: Data.Context, isLastLayer: boolean) {
    updateProgress(ctx.progress, 1);
    
    // const { extent } = ctx.sources[0].header;
    // const { readHeight, valuesOffset } = ctx.sources[0].layer;

    // for (let v = 0; v < ctx.blockCounts[0]; v++) {
    //     for (let u = 0; u < ctx.blockCounts[1]; u++) {
    //         for (let src of ctx.sources) {
    //             let numBytes = Writer.fillCube(ctx, src.layer.buffer.values, valuesOffset, u, v, readHeight);
    //             await File.write(ctx.file, ctx.cubeBuffer, numBytes);
    //             Writer.updateProgress(ctx.progress, 1);
    //         }
    //     }
    // }
} 

function updateProgress(progress: Data.Progress, progressDone: number) {
    let old = (100 * progress.current / progress.max).toFixed(0);
    progress.current += progressDone;
    let $new = (100 * progress.current / progress.max).toFixed(0);
    if (old !== $new) {
        process.stdout.write(`\rWriting data...    ${$new}%`);
    }
}