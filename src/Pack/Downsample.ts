// /*
//  * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
//  */

// import * as CCP4 from './CCP4'
// import * as File from '../Utils/File'
// import * as Writer from './Writer'

// export interface Context extends Writer.Context {  
//     extent: number[],
//     extentDelta: number[],
//     sampleDelta: number[],

//     /** Holds the number of slices that need to be downsamples. */
//     downsampleBuffer: File.ValueArray[],

//     /** Downsamples slices for each source. It's a buffer with "blockSize height" */
//     downsampledSlices: File.ValueArray[],

//     currentDownsampledRow: number,

//     /** How many values along each axis to collapse into 1. */
//     sampleRate: number,

//     /** Number of input slices that have been processed. */
//     currentSlice: number,

//     /** Number of input slices that are available. */
//     endSlice: number
// }

// interface SliceBuffer {
//     values: File.ValueArray[],
//     startSlice: number,
//     height: number,

//     numSlices: number,
//     neededSlices: number,
// }

// export async function createContext(filename: string, progress: Writer.GlobalProgress, sources: CCP4.Data[], blockSize: number, sampleRate: number): Promise<Context> {
//     const extent = sources[0].header.extent;
//     const samples = [Math.ceil(extent[0] / sampleRate), Math.ceil(extent[1] / sampleRate), Math.ceil(extent[2] / sampleRate)];
//     const downsampleSliceSize = samples[0] * samples[1] * blockSize;

//     const downsampleSliceRate = Math.ceil((samples[2] * sampleRate / extent[2]) * sampleRate);
//     const downsampleBufferSize = extent[0] * extent[1] * downsampleSliceRate;

//     // 2 * Math.ceil(sampleRate * sampleCounts[0] / extent[0])

//     return <Context>{
//         file: await File.createFile(filename),
//         sigmasOffset: 0,
//         sources,
//         blockHeader: void 0,
//         progress,

//         blockSize, 
//         samples,
//         blockCounts: [Math.ceil(samples[0] / blockSize) | 0, Math.ceil(samples[1] / blockSize) | 0, Math.ceil(samples[2] / blockSize) | 0],
//         cubeBuffer: new Buffer(new ArrayBuffer(sources[0].layer.buffer.elementByteSize * blockSize * blockSize * blockSize)),

//         //downsampledBuffer: sources.map(_ => new Float32Array(downsampleBufferSize)),
//         //downsampledSlices: sources.map(_ => new Float32Array(downsampleSliceSize)),
//         sampleRate,
//         currentSlice: 0,
//         endSlice: 0      
//     }
// }

// function lerp(ctx: Context, index: number, u: number, v: number, w: number) {
//     const data = ctx.downsampleBuffer[index];
//     const { extent } = ctx;

//     const u0 = Math.floor(u), u1 = Math.ceil(u), tU = u - u0;
//     const v0 = Math.floor(v), v1 = Math.ceil(v), tV = v - v0;
//     const w0 = Math.floor(w), w1 = Math.ceil(w), tW = w - w0;

//     // k * extent[0] * extent[1] + j * extent[0] + i;
//     const c00 = data[w0 * extent[0] * extent[1] + v0 * extent[0] + u0] * (1 - tU) + data[w0 * extent[0] * extent[1] + v0 * extent[0] + u1] * tU;
//     const c01 = data[w1 * extent[0] * extent[1] + v0 * extent[0] + u0] * (1 - tU) + data[w1 * extent[0] * extent[1] + v0 * extent[0] + u1] * tU;
//     const c10 = data[w0 * extent[0] * extent[1] + v1 * extent[0] + u0] * (1 - tU) + data[w0 * extent[0] * extent[1] + v1 * extent[0] + u1] * tU;
//     const c11 = data[w1 * extent[0] * extent[1] + v1 * extent[0] + u0] * (1 - tU) + data[w1 * extent[0] * extent[1] + v1 * extent[0] + u1] * tU;

//     const c0 = c00 * (1 - tV) + c10 * tV;
//     const c1 = c01 * (1 - tV) + c11 * tV;

//     return c0 * (1 - tW) + c1 * tW;
// }

// function sumBlock(ctx: Context, index: number, u: number, v: number) {
//     const { sampleRate, sampleDelta } = ctx;
//     const startH = u * sampleRate, endH = startH + sampleRate;
//     const startK = v * sampleRate, endK = startK + sampleRate;
//     const dH = sampleDelta[0], dK = sampleDelta[1], dL = sampleDelta[2];
    
//     let sum = 0;

//     for (let l = 0; l < sampleRate; l++) {
//         const oL = l * dL;
//         for (let k = startK; k < endK; k++) {
//             const oK = k * dK;
//             for (let h = startH; h < endH; h++) {
//                 const oH = h * dH;
//                 sum += lerp(ctx, index, oH, oK, oL);
//             }
//         }        
//     }

//     return sum / (sampleRate * sampleRate * sampleRate);
// }

// function downsampleSlice(ctx: Context) {
//     const { samples, sampleRate, downsampleBuffer, downsampledSlices } = ctx;

//     const cU = samples[0];
//     const cV = samples[1];

//     const downsampleRow = ctx.currentDownsampledRow;
//     for (let index = 0; index < ctx.sources.length; index++) {
//         const downsampledSlice = downsampledSlices[index];
//         for (let v = 0; v < cV; v++) {
//             for (let u = 0; u < cU; u++) {
//                 const sum = sumBlock(ctx, index, u, v);
//                 downsampledSlice[ctx.currentDownsampledRow * samples[0] * samples[1] + v * samples[0] + u] = sum;
//             }
//         }
//     }

//     ctx.currentDownsampledRow++; 
// }

// function prepareNextSlice(ctx: Context): boolean {
//     return false;
// }

// function canWriteBlocks(ctx: Context) {
//     return false;
// }

// async function writeBlocks(ctx: Context) {

// }

// export async function processLayer(ctx: Context) {
//     while (prepareNextSlice(ctx)) {
//         downsampleSlice(ctx);
//         if (canWriteBlocks(ctx)) {
//             await writeBlocks(ctx);
//         }
//     }
// }