/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Utils/File'
import * as BlockFormat from '../Common/BlockFormat'

const FORMAT_VERSION = 1;

export interface Context {
    file: File.WriteContext, 
    sigmasOffset: number,    
    sources: CCP4.Data[],
    blockHeader: BlockFormat.Header | undefined,
    progress: GlobalProgress,
    
    blockSize: number, 

    isPeriodic: boolean,
    samples: number[], 

    /** Math.ceil(sampleCounts / blockSize) */
    blockCounts: number[],
        
    cubeBuffer: Buffer
}

export interface GlobalProgress {
    current: number,
    max: number
}

export interface CubeContext {
    size: number,
    buffer: Buffer,
    extent: number[],
    numU: number,
    numV: number
}

export function createCubeContext(params: { elementByteSize: number, blockSize: number, extent: number[] }): CubeContext {
    return {
        buffer: new Buffer(new ArrayBuffer(params.elementByteSize * params.blockSize * params.blockSize * params.blockSize)),
        size: params.blockSize,
        extent: params.extent,
        numU: Math.ceil(params.extent[0] / params.blockSize) | 0,
        numV: Math.ceil(params.extent[1] / params.blockSize) | 0
    }
}

export function fillCube(ctx: Context, values: File.ValueArray, valuesOffset: number, u: number, v: number, height: number) {
    const oH = ctx.blockSize * u;
    const oK = ctx.blockSize * v;
    const sizeH = ctx.samples[0];
    const sizeHK = ctx.samples[0] * ctx.samples[1]; 

    const cH = Math.min(ctx.blockSize, ctx.samples[0] - oH);
    const cK = Math.min(ctx.blockSize, ctx.samples[1] - oK);
    const cL = height;

    const elementByteSize = ctx.sources[0].layer.buffer.elementByteSize;
    const isFloat = ctx.sources[0].layer.buffer.type === File.ValueType.Float32;
    const buffer = ctx.cubeBuffer;

    let offset = 0;   
    for (let l = 0; l < cL; l++) {
        for (let k = 0; k < cK; k++) {
            for (let h = 0; h < cH; h++) {
                const t = values[valuesOffset + oH + h + (k + oK) * sizeH + l * sizeHK];
                if (isFloat) buffer.writeFloatLE(t, offset, true);
                else buffer.writeInt8(t, offset, true);
                offset += elementByteSize;
            }
        }        
    }

    return offset;
}

function makeHeader(ctx: Context): BlockFormat.Header {
    const header = ctx.sources[0].header;
    const headers = ctx.sources.map(d => d.header);
    const grid = header.grid;

    function normalize(data: number[]) {
        return [data[0] / grid[0], data[1] / grid[1], data[2] / grid[2]];
    } 

    return {
        version: FORMAT_VERSION,
        numDensities: ctx.sources.length,
        formatId: header.mode == CCP4.Mode.Float32 ? BlockFormat.FormatId.Float32 : BlockFormat.FormatId.Int8,
        blockSize: ctx.blockSize,
        axisOrder: header.axisOrder,
        dimensions: normalize(header.extent),
        origin: normalize(header.origin),
        spacegroupNumber: header.spacegroupNumber,
        cellSize: header.cellSize,
        cellAngles: header.cellAngles,
        isPeriodic: ctx.isPeriodic,
        means: headers.map(h => h.mean),
        sigmas: headers.map(h => h.sigma),
        minimums: headers.map(h => h.min),
        maximums: headers.map(h => h.max),
        names: headers.map(h => h.name),
        sampling: []
    }
}

export async function writeHeader(ctx: Context) {    
    const header = makeHeader(ctx);


    // 0:1   Format Version
    await File.writeInt(ctx.file, FORMAT_VERSION);

    // 1:1   N = Num densities
    await File.writeInt(ctx.file, header.numDensities);

    // 2:1   Format ID (0 = float32 values, 1 = int8 values)
    await File.writeInt(ctx.file, header.formatId);

    // 3:1   Block size
    await File.writeInt(ctx.file, ctx.blockSize);

    // 4:3   Axis order
    for (let v of header.axisOrder) await File.writeInt(ctx.file, v);

    // 7:3   Samples
    for (let v of header.samples) await File.writeInt(ctx.file, v);

    // 10:6  Dimensions
    for (let v of header.dimensions) await File.writeDouble(ctx.file, v);

    // 16:6  Origin
    for (let v of header.origin) await File.writeDouble(ctx.file, v);
    
    // 22:1  Spacegroup number
    await File.writeInt(ctx.file, header.spacegroupNumber);

    // 23:6   Cell (dimensions + angles)
    for (let v of header.cellSize) await File.writeFloat(ctx.file, v);
    for (let v of header.cellAngles) await File.writeFloat(ctx.file, v);

    // 29:N  Density means
    for (let v of header.means) await File.writeFloat(ctx.file, v);

    ctx.sigmasOffset = ctx.file.position;
    // (29+N):N   Density sigmas
    for (let v of header.means) await File.writeFloat(ctx.file, v);

    // (29+2N):N  Density mins
    for (let v of header.minimums) await File.writeFloat(ctx.file, v);

    // (29+3N):N  Density maximums
    for (let v of header.maximums) await File.writeFloat(ctx.file, v);

    // (29+4N):8N Density names (32 chars max each)
    for (let n of header.names) await File.writeString(ctx.file, n, 32);

    // <BLOCK_00><BLOCK_01>...<BLOCK_0N>
    // <BLOCK_K0><BLOCK_K1>...<BLOCK_KN>   

    // header.dataByteOffset = ctx.file.position;
    return header;
}

export async function writeInfo(ctx: Context) {
    let o = 0;
    ctx.blockHeader!.sigmas = ctx.sources.map(s => s.header.sigma);
    for (let v of ctx.sources) {
        await File.writeFloat(ctx.file, v.header.sigma, ctx.sigmasOffset + o);
        o += 4;
    }
    ctx.blockHeader!.minimums = ctx.sources.map(s => s.header.min);
    for (let v of ctx.sources) {
        await File.writeFloat(ctx.file, v.header.min, ctx.sigmasOffset + o);
        o += 4;
    }
    ctx.blockHeader!.maximums = ctx.sources.map(s => s.header.max);
    for (let v of ctx.sources) {
        await File.writeFloat(ctx.file, v.header.max, ctx.sigmasOffset + o);
        o += 4;
    }
}

export function updateProgress(progress: GlobalProgress, progressDone: number) {
    let old = (100 * progress.current / progress.max).toFixed(0);
    progress.current += progressDone;
    let $new = (100 * progress.current / progress.max).toFixed(0);
    if (old !== $new) {
        process.stdout.write(`\rWriting data...    ${$new}%`);
    }
}