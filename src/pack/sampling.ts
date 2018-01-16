/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './ccp4'
import * as Data from './data-model'
import * as File from '../common/file'
import * as Downsampling from './downsampling'
import * as Writer from './writer'
import * as DataFormat from '../common/data-format'

export async function createContext(filename: string, channels: CCP4.Data[], blockSize: number, isPeriodic: boolean): Promise<Data.Context> {
    const header = channels[0].header;
    const samplingCounts = getSamplingCounts(channels[0].header.extent, blockSize);
    const valueType = CCP4.getValueType(header);
    const cubeBuffer = new Buffer(new ArrayBuffer(channels.length * blockSize * blockSize * blockSize * DataFormat.getValueByteSize(valueType)));

    const litteEndianCubeBuffer = File.IsNativeEndianLittle
        ? cubeBuffer
        : new Buffer(new ArrayBuffer(channels.length * blockSize * blockSize * blockSize * DataFormat.getValueByteSize(valueType)));

    // The data can be periodic iff the extent is the same as the grid and origin is 0.
    if (header.grid.some((v, i) => v !== header.extent[i]) || header.origin.some(v => v !== 0)) {
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
        kernel: { size: 5, coefficients: [1, 4, 6, 4, 1], coefficientSum: 16 },
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

export async function processData(ctx: Data.Context) {
    const channel = ctx.channels[0];
    while (!channel.slices.isFinished) {
        for (const src of ctx.channels) {
            await CCP4.readSlices(src);
        }
        await processSlices(ctx);
    }
}

/** Determine the suitable sampling rates for the input data */
function getSamplingCounts(baseSampleCount: number[], blockSize: number) {
    const ret = [baseSampleCount];
    let prev = baseSampleCount;
    let hasSingleBoxSampling = false;
    while (true) {
        let next = [0, 0, 0];
        let max = 0;
        for (let i = 0; i < 3; i++) {
            const s = Math.floor((prev[i] + 1) / 2);
            if (s < 2) return ret;
            if (s > max) max = s;
            next[i] = s;
        }
        // no point in downsampling below the block size.
        if (max < blockSize) {
            if (hasSingleBoxSampling) return ret;
            hasSingleBoxSampling = true;
        }
        ret.push(next);
        prev = next;
    }
}

function createBlockBuffer(sampleCount: number[], blockSize: number, valueType: DataFormat.ValueType, numChannels: number): Data.BlockBuffer {
    const values = [];
    for (let i = 0; i < numChannels; i++) values[i] = DataFormat.createValueArray(valueType, sampleCount[0] * sampleCount[1] * blockSize);
    return {
        values,
        buffers: values.map(xs => new Buffer(xs.buffer)),
        slicesWritten: 0
    };
}

function createDownsamplingBuffer(valueType: DataFormat.ValueType, sourceSampleCount: number[], targetSampleCount: number[], numChannels: number): Data.DownsamplingBuffer[] {
    const ret = [];
    for (let i = 0; i < numChannels; i++) {
        ret[ret.length] = {
            downsampleH: DataFormat.createValueArray(valueType, sourceSampleCount[1] * targetSampleCount[0]),
            downsampleHK: DataFormat.createValueArray(valueType, 5 * targetSampleCount[0] * targetSampleCount[1]),
            slicesWritten: 0,
            startSliceIndex: 0
        }
    }
    return ret;
}

function createSampling(index: number, valueType: DataFormat.ValueType, numChannels: number, sampleCounts: number[][], blockSize: number): Data.Sampling {
    const sampleCount = sampleCounts[index];
    const valuesInfo: Data.ValuesInfo[] = [];
    for (let i = 0; i < numChannels; i++) {
        valuesInfo[valuesInfo.length] = {
            sum: 0.0,
            sqSum: 0.0,
            max: Number.NEGATIVE_INFINITY,
            min: Number.POSITIVE_INFINITY
        }
    }
    return {
        rate: 1 << index,
        sampleCount,
        blocks: createBlockBuffer(sampleCount, blockSize, valueType, numChannels),
        valuesInfo,
        downsampling: index < sampleCounts.length - 1 ? createDownsamplingBuffer(valueType, sampleCount, sampleCounts[index + 1], numChannels) : void 0,

        byteOffset: 0,
        byteSize: numChannels * sampleCount[0] * sampleCount[1] * sampleCount[2] * DataFormat.getValueByteSize(valueType),
        writeByteOffset: 0
    }
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
            const v = src[srcOffset + i];
            target[targetOffset + i] = v;
        }
    }

    blocks.slicesWritten++;
}

function updateValuesInfo(sampling: Data.Sampling) {
    const { blocks, sampleCount } = sampling;
    const size = blocks.slicesWritten * sampleCount[0] * sampleCount[1];

    for (let channelIndex = 0; channelIndex < blocks.values.length; channelIndex++) {
        const values = blocks.values[channelIndex];
        const valuesInfo = sampling.valuesInfo[channelIndex];
        let { sum, sqSum, max, min } = valuesInfo;
        for (let i = 0; i < size; i++) {
            const v = values[i];
            sum += v;
            sqSum += v * v;
            if (v > max) max = v;
            else if (v < min) min = v;
        }
        valuesInfo.sum = sum;
        valuesInfo.sqSum = sqSum;
        valuesInfo.max = max;
        valuesInfo.min = min;
    }
}

function shouldSamplingBeWritten(sampling: Data.Sampling, blockSize: number, isDataFinished: boolean) {
    if (isDataFinished) return sampling.blocks.slicesWritten > 0;
    return sampling.blocks.slicesWritten >= blockSize;
}

async function writeBlocks(ctx: Data.Context, isDataFinished: boolean) {
    for (const s of ctx.sampling) {
        if (shouldSamplingBeWritten(s, ctx.blockSize, isDataFinished)) {
            updateValuesInfo(s);
            await Writer.writeBlockLayer(ctx, s);
        }
    }
}

async function processSlices(ctx: Data.Context) {
    const channel = ctx.channels[0];
    const sliceCount = channel.slices.sliceCount;
    for (let i = 0; i < sliceCount; i++) {
        copyLayer(ctx, i);
        Downsampling.downsampleLayer(ctx);

        await writeBlocks(ctx, false);

        const isDataFinished = i === sliceCount - 1 && channel.slices.isFinished;
        if (isDataFinished) {
            Downsampling.finalize(ctx);
            await writeBlocks(ctx, true);
        }
    }
}