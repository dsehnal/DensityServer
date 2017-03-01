/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from '../Utils/File'
import * as BlockFormat from '../Common/BlockFormat'
import * as Data from './DataModel'

import * as fs from 'fs'

export async function allocateFile(ctx: Data.Context) {
    const { totalByteSize, file } = ctx;
    const buffer = new Buffer(Math.min(totalByteSize, 4 * 1024 * 1024));
    let written = 0;
    for (let i = 0, _ii = totalByteSize / buffer.byteLength; i < _ii; i++) {
        fs.writeSync(file.file, buffer, 0, Math.min(totalByteSize - written, buffer.byteLength));
    }
}

export async function writeHeader(ctx: Data.Context) {
    const header = BlockFormat.encodeHeader(Data.createHeader(ctx));
    await File.writeInt(ctx.file, header.byteLength);
    await File.writeBuffer(ctx.file.file, 4, header);
}

// export interface CubeContext {
//     size: number,
//     buffer: Buffer,
//     extent: number[],
//     numU: number,
//     numV: number
// }

// export function createCubeContext(params: { elementByteSize: number, blockSize: number, extent: number[] }): CubeContext {
//     return {
//         buffer: new Buffer(new ArrayBuffer(params.elementByteSize * params.blockSize * params.blockSize * params.blockSize)),
//         size: params.blockSize,
//         extent: params.extent,
//         numU: Math.ceil(params.extent[0] / params.blockSize) | 0,
//         numV: Math.ceil(params.extent[1] / params.blockSize) | 0
//     }
// }

// export function fillCube(ctx: Context, values: File.ValueArray, valuesOffset: number, u: number, v: number, height: number) {
//     const oH = ctx.blockSize * u;
//     const oK = ctx.blockSize * v;
//     const sizeH = ctx.samples[0];
//     const sizeHK = ctx.samples[0] * ctx.samples[1]; 

//     const cH = Math.min(ctx.blockSize, ctx.samples[0] - oH);
//     const cK = Math.min(ctx.blockSize, ctx.samples[1] - oK);
//     const cL = height;

//     const elementByteSize = ctx.sources[0].layer.buffer.elementByteSize;
//     const isFloat = ctx.sources[0].layer.buffer.type === File.ValueType.Float32;
//     const buffer = ctx.cubeBuffer;

//     let offset = 0;   
//     for (let l = 0; l < cL; l++) {
//         for (let k = 0; k < cK; k++) {
//             for (let h = 0; h < cH; h++) {
//                 const t = values[valuesOffset + oH + h + (k + oK) * sizeH + l * sizeHK];
//                 if (isFloat) buffer.writeFloatLE(t, offset, true);
//                 else buffer.writeInt8(t, offset, true);
//                 offset += elementByteSize;
//             }
//         }        
//     }

//     return offset;
// }
