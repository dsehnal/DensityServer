/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as Data from './DataModel'
import * as File from '../Common/File'
import * as Downsampling from './Downsampling'
import * as Writer from './Writer'
import * as DataFormat from '../Common/DataFormat'

function getSamplingRates(baseSampleCount: number[], blockSize: number) {
    const allowedDivisors = [2, 3, 5];
    const maxDiv = 2 * Math.ceil(baseSampleCount.reduce((m, v) => Math.min(m, v), baseSampleCount[0]) / blockSize);
    const ret = [1];
    for (let i = 2; i <= maxDiv; i++) {
        // we do not want "large"" prime divisors such as 13 or 17.
        if (allowedDivisors.some(d => (i % d) === 0)) {
            ret.push(i);
        }
    }
    return ret;
}

function createBuffer(type: DataFormat.ValueType, size: number): DataFormat.ValueArray {
    if (type === DataFormat.ValueType.Float32) {
        return new Float32Array(new ArrayBuffer(4 * size));
    }
    return new Int8Array(new ArrayBuffer(size));
}

function createBlocksLayer(sampleCount: number[], blockSize: number, valueType: DataFormat.ValueType, numChannels: number): Data.BlocksLayer {
    const values = [];
    for (let i = 0; i < numChannels; i++) values[i] = createBuffer(valueType, sampleCount[0] * sampleCount[1] * blockSize);
    return {
        dimensions: [sampleCount[0], sampleCount[1], blockSize],
        values,
        buffers: values.map(xs => new Buffer(xs.buffer)),
        lastProcessedSlice: 0,
        slicesWritten: 0,
        isFull: false
    };
}

function createSampling(valueType: DataFormat.ValueType, numChannels: number, baseSampleCount: number[], blockSize: number, rate: number): Data.Sampling {
    const sampleCount = baseSampleCount.map(s => Math.ceil(s / rate));
    const delta = [ 
        baseSampleCount[0] / (rate * sampleCount[0] - 1), 
        baseSampleCount[1] / (rate * sampleCount[1] - 1), 
        baseSampleCount[2] / (rate * sampleCount[2] - 1)
    ];

    return {
        rate,
        sampleCount,
        delta,
        blocksLayer: createBlocksLayer(sampleCount, blockSize, valueType, numChannels),

        dataSliceIndex: 0,
        byteOffset: 0,
        byteSize: numChannels * sampleCount[0] * sampleCount[1] * sampleCount[2] * DataFormat.getValueByteSize(valueType),
        writeByteOffset: 0
    }
}

function createLerpCube(sampleCounts: number[]): Data.LerpCube {
    return {
        cube: [0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1], // 0.1 so that it is backed by a double array
        z0Offset: 0,
        z1Offset: 0,
        sizeI: sampleCounts[0],
        sizeIJ: sampleCounts[0] * sampleCounts[1]
    }
}

export async function createContext(filename: string, channels: CCP4.Data[], blockSize: number, isPeriodic: boolean): Promise<Data.Context> {
    const header = channels[0].header;
    const rates = getSamplingRates(channels[0].header.extent, blockSize);
    const valueType = CCP4.getValueType(header); 
    const cubeBuffer = new Buffer(new ArrayBuffer(channels.length * blockSize * blockSize * blockSize * DataFormat.getValueByteSize(valueType)));
    const litteEndianCubeBuffer = File.IsNativeEndianLittle 
        ? cubeBuffer
        : new Buffer(new ArrayBuffer(channels.length * blockSize * blockSize * blockSize * DataFormat.getValueByteSize(valueType)));
    
    // The data can be periodic iff the extent is the same as the grid.
    if (header.grid.some((v, i) => v !== header.extent[i])) isPeriodic = false;
    
    const ctx: Data.Context = {
        file: await File.createFile(filename),
        isPeriodic,
        channels,
        valueType,
        blockSize,
        cubeBuffer,
        litteEndianCubeBuffer,
        sampling: rates.map(r => createSampling(valueType, channels.length, header.extent, blockSize, r)),
        lerpCube: createLerpCube(header.extent),
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

    ctx.dataByteOffset = 4 + DataFormat.encodeHeader(Data.createHeader(ctx)).byteLength;
    ctx.totalByteSize = ctx.dataByteOffset + byteOffset;

    return ctx;
}

export async function processLayer(ctx: Data.Context) {
    const { kSampling } = ctx;    
    advanceSampling1(kSampling[1][0], ctx);
    for (let k = 2; k < kSampling.length; k++) {
        if (!kSampling[k].length) continue;
        Downsampling.advanceSamplingK(k, kSampling[k], ctx);
    }
    await Writer.writeCubeLayers(ctx);
}

/** Advances sampling rate 1 */
function advanceSampling1(sampling: Data.Sampling, ctx: Data.Context) {
    const { channels } = ctx;
    const { blocksLayer } = sampling;
    const size = blocksLayer.dimensions[0] * blocksLayer.dimensions[1] * channels[0].layer.readHeight;    
    const targetOffset = blocksLayer.slicesWritten * blocksLayer.dimensions[0] * blocksLayer.dimensions[1];

    for (let i = 0; i < channels.length; i++) {
        const layer = channels[i].layer;
        const target = blocksLayer.values[i];
        const { values, valuesOffset } = layer;
        for (let o = 0; o < size; o++) { 
            target[targetOffset + o] = values[valuesOffset + o];
        }
    }
    blocksLayer.isFull = (channels[0].layer.readCount % 2) === 0 || channels[0].layer.isFinished;
    blocksLayer.slicesWritten += channels[0].layer.readHeight;
    blocksLayer.lastProcessedSlice = channels[0].layer.endSlice;
}