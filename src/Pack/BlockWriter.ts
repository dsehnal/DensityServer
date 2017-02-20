/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Utils/File'

const FORMAT_VERSION = 1;

export interface Context {
    file: File.WriteContext, 
    sigmasOffset: number,    
    sources: CCP4.Data[], 
    progress: GlobalProgress,
    

    blockSize: number, 

    sampleCounts: number[], 

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

export function fillCube(ctx: Context, values: File.ValueArray, u: number, v: number, height: number) {
    const oH = ctx.blockSize * u;
    const oK = ctx.blockSize * v;
    const sizeH = ctx.sampleCounts[0];
    const sizeHK = ctx.sampleCounts[0] * ctx.sampleCounts[1]; 

    const cH = Math.min(ctx.blockSize, ctx.sampleCounts[0] - oH);
    const cK = Math.min(ctx.blockSize, ctx.sampleCounts[1] - oK);
    const cL = height;

    const elementByteSize = ctx.sources[0].slice.data.elementByteSize;
    const isFloat = ctx.sources[0].slice.data.type === File.ValueType.Float32;
    const buffer = ctx.cubeBuffer;

    let offset = 0;   
    for (let l = 0; l < cL; l++) {
        for (let k = 0; k < cK; k++) {
            for (let h = 0; h < cH; h++) {
                const t = values[oH + h + (k + oK) * sizeH + l * sizeHK];
                if (isFloat) buffer.writeFloatLE(t, offset, true);
                else buffer.writeInt8(t, offset, true);
                offset += elementByteSize;
            }
        }        
    }

    return offset;
}

export async function writeHeader(ctx: Context) {    
    let header = ctx.sources[0].header;
    let headers = ctx.sources.map(d => d.header);

    // Layout
    // 1     Magic constant/byte order
    await File.writeInt(ctx.file, 0x1237);

    // 1     Format Version
    await File.writeInt(ctx.file, FORMAT_VERSION);

    // 1     N = Num densities
    await File.writeInt(ctx.file, ctx.sources.length);

    ////////////////////////////////////////////////////////

    // 0:1   Format ID (0 = float32 values, 1 = int8 values)
    await File.writeInt(ctx.file, header.mode == CCP4.Mode.Float32 ? 0 : 1);

    // 1:3   Grid size
    for (let v of header.grid) await File.writeInt(ctx.file, v);

    // 4:1   Block size
    await File.writeInt(ctx.file, ctx.blockSize);

    // 5:3   Axis order
    for (let v of header.axisOrder) await File.writeInt(ctx.file, v);

    // 8:3   Extent
    for (let v of header.extent) await File.writeInt(ctx.file, v);

    // 11:3   Sample Counts
    for (let v of ctx.sampleCounts) await File.writeInt(ctx.file, v);

    // 14:3   Origin
    for (let v of header.origin) await File.writeFloat(ctx.file, v);

    // 17:1   Spacegroup number
    await File.writeInt(ctx.file, header.spacegroupNumber);

    // 18:6   Cell (dimensions + angles)
    for (let v of header.cellSize) await File.writeFloat(ctx.file, v);
    for (let v of header.cellAngles) await File.writeFloat(ctx.file, v);

    // 24:N  Density means
    for (let h of headers) await File.writeFloat(ctx.file, h.mean);

    ctx.sigmasOffset = ctx.file.position;
    // (24+N):N   Density sigmas
    for (let h of headers) await File.writeFloat(ctx.file, h.sigma);

    // (24+2N):N   Density mins
    for (let h of headers) await File.writeFloat(ctx.file, h.min);

    // (24+3N):N   Density mins
    for (let h of headers) await File.writeFloat(ctx.file, h.max);

    // (24+4*N):8*N  Density names (32 chars max each)
    for (let h of headers) await File.writeString(ctx.file, h.name, 32);

    // <BLOCK_00><BLOCK_01>...<BLOCK_0N>
    // <BLOCK_K0><BLOCK_K1>...<BLOCK_KN>   
}

export async function writeInfo(ctx: Context) {
    let o = 0;
    for (let v of ctx.sources) {
        await File.writeFloat(ctx.file, v.header.sigma, ctx.sigmasOffset + o);
        o += 4;
    }
    for (let v of ctx.sources) {
        await File.writeFloat(ctx.file, v.header.min, ctx.sigmasOffset + o);
        o += 4;
    }
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