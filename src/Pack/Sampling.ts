/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as Data from './DataModel'
import * as File from '../Common/File'
import * as Downsampling from './Downsampling'
import * as Writer from './Writer'
import * as DataFormat from '../Common/DataFormat'

function getSamplingCounts(baseSampleCount: number[]) {
    const ret = [baseSampleCount];
    let prev = baseSampleCount;
    while (true) {
        let next = [0, 0, 0];        
        let max = 0;
        for (let i = 0; i < 3; i++) {
            const s = Math.floor((prev[i] + 1) / 2);
            if (s < 2) return ret;
            if (s > max) max = s;
            next[i] = s;
        }
        if (max < 32) return ret;
        ret.push(next);
        prev = next;
        return ret;
    }
}

function createBlockBuffer(sampleCount: number[], blockSize: number, valueType: DataFormat.ValueType, numChannels: number): Data.BlockBuffer {
    const values = [];
    for (let i = 0; i < numChannels; i++) values[i] = DataFormat.createValueArray(valueType, sampleCount[0] * sampleCount[1] * blockSize);
    return {
        values,
        buffers: values.map(xs => new Buffer(xs.buffer)),
        slicesWritten: 0,
        isFull: false
    };
}

function createDownsamplingBuffer(valueType: DataFormat.ValueType, sourceSampleCount: number[], targetSampleCount: number[], numChannels: number): Data.DownsamplingBuffer[] {
    const ret = [];
    for (let i = 0; i < numChannels; i++) {
        ret[ret.length] = {
            downsampleX: DataFormat.createValueArray(valueType, sourceSampleCount[1] * targetSampleCount[0]),
            downsampleXY: DataFormat.createValueArray(valueType, 4 * targetSampleCount[0] * targetSampleCount[1]),
            slicesWritten: 0,
            startSliceIndex: 0
        }
    }
    return ret;
}

function createSampling(index: number, valueType: DataFormat.ValueType, numChannels: number, sampleCounts: number[][], blockSize: number): Data.Sampling {
    const sampleCount = sampleCounts[index];
    return {
        rate: 1 << index,
        sampleCount,
        blocks: createBlockBuffer(sampleCount, blockSize, valueType, numChannels),
        downsampling: index < sampleCounts.length - 1 ? createDownsamplingBuffer(valueType, sampleCount, sampleCounts[index + 1], numChannels) : void 0,

        byteOffset: 0,
        byteSize: numChannels * sampleCount[0] * sampleCount[1] * sampleCount[2] * DataFormat.getValueByteSize(valueType),
        writeByteOffset: 0
    }
}

export async function createContext(filename: string, channels: CCP4.Data[], blockSize: number, isPeriodic: boolean): Promise<Data.Context> {
    const header = channels[0].header;
    const samplingCounts = getSamplingCounts(channels[0].header.extent);
    const valueType = CCP4.getValueType(header); 
    const cubeBuffer = new Buffer(new ArrayBuffer(channels.length * blockSize * blockSize * blockSize * DataFormat.getValueByteSize(valueType)));
    const litteEndianCubeBuffer = File.IsNativeEndianLittle 
        ? cubeBuffer
        : new Buffer(new ArrayBuffer(channels.length * blockSize * blockSize * blockSize * DataFormat.getValueByteSize(valueType)));
    
    // The data can be periodic iff the extent is the same as the grid and origin is 0.
    if (header.grid.some((v, i) => v !== header.extent[i]) || header.origin.some(v => v !== 0) ) {
        isPeriodic = false;
    }

    const ctx: Data.Context = {
        file: await File.createFile(filename),
        isPeriodic,
        channels,
        valueType,
        blockSize,
        cubeBuffer,
        litteEndianCubeBuffer,
        sampling: samplingCounts.map((__, i) => createSampling(i, valueType, channels.length, samplingCounts, blockSize)),
        dataByteOffset: 0,
        totalByteSize: 0,
        progress: { current: 0, max: 0 }
    };
    
    let byteOffset = 0;
    for (const s of ctx.sampling) {
        // Max progress = total number of blocks that need to be written.
        ctx.progress.max += Data.samplingBlockCount(s, blockSize);
        s.byteOffset = byteOffset;
        byteOffset += s.byteSize;
    }

    ctx.dataByteOffset = 4 + DataFormat.encodeHeader(Data.createHeader(ctx)).byteLength;
    ctx.totalByteSize = ctx.dataByteOffset + byteOffset;

    return ctx;
}

function copyLayer(ctx: Data.Context, sliceIndex: number) {
    const { channels } = ctx;
    const { blocks, sampleCount } = ctx.sampling[0];

    const size = sampleCount[0] * sampleCount[1];
    const srcOffset = sliceIndex * size;
    const targetOffset = blocks.slicesWritten * size;

    for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        const src = channels[channelIndex].slices.values;
        const target = blocks.values[channelIndex];
        for (let i = 0; i < size; i++) {
            target[targetOffset + i] = src[srcOffset + i];
        }
    }

    blocks.slicesWritten++;
    blocks.isFull = blocks.slicesWritten === ctx.blockSize;
}

export async function processData(ctx: Data.Context) {
    const channel = ctx.channels[0];
    const sliceCount = channel.slices.sliceCount;
    for (let i = 0; i < sliceCount; i++) {        
        console.log('layer', i);
        copyLayer(ctx, i);
        Downsampling.downsampleLayer(ctx);

        if (i === sliceCount - 1 && channel.slices.isFinished) {
            Downsampling.finalize(ctx);
        }

        for (const s of ctx.sampling) {
            if (i === sliceCount - 1 && channel.slices.isFinished) s.blocks.isFull = true;

            if (s.blocks.isFull) {
                console.log(' writing rate', s.rate, s.blocks.slicesWritten);
                await Writer.writeBlockLayer(ctx, s);
            }
        }
    }
}