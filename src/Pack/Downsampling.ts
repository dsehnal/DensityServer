/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'
import * as DataFormat from '../Common/DataFormat'

/**
 * The functions downsampleH and downsampleHK both essentially do the
 * same thing: downsample along H (1st axis in axis order) and K (2nd axis in axis order) axes respectively.
 * 
 * The reason there are two copies of almost the same code is performance:
 * Both functions use a different memory layout to improve cache coherency
 *  - downsampleU uses the H axis as the fastest moving one
 *  - downsampleUV uses the K axis as the fastest moving one
 */


function conv(w: number, c: number[], src: DataFormat.ValueArray, b: number, i0: number, i1: number, i2: number, i3: number, i4: number) {
    return  w * (c[0] * src[b + i0] + c[1] * src[b + i1] + c[2] * src[b + i2] + c[3] * src[b + i3] + c[4] * src[b + i4]);
}

/**
 * Map from L-th slice in src to an array of dimensions (srcDims[1], (srcDims[0] / 2), 1),
 * flipping the 1st and 2nd axis in the process to optimize cache coherency for _downsampleUV call.
 */
function downsampleH(kernel: Data.Kernel, srcDims: number[], src: DataFormat.ValueArray, srcLOffset: number, target: DataFormat.ValueArray) {
    const sizeH = srcDims[0], sizeK = srcDims[1], srcBaseOffset = srcLOffset * sizeH * sizeK;
    const targetH = Math.floor((sizeH + 1) / 2);
    const isEven = sizeH % 2 === 0;
    const w = 1.0 / kernel.coefficientSum;
    const c = kernel.coefficients;

    for (let k = 0; k < sizeK; k++) {
        let srcOffset = srcBaseOffset + k * sizeH;
        let targetOffset = k;
        target[targetOffset] = conv(w, c, src, srcOffset, 0, 0, 0, 1, 2);        
        for (let h = 1; h < targetH - 1; h++) {
            srcOffset += 2; targetOffset += sizeK;
            target[targetOffset] = conv(w, c, src, srcOffset, -2, -1, 0, 1, 2);
        }        
        srcOffset += 2; targetOffset += sizeK;
        if (isEven) target[targetOffset] = conv(w, c, src, srcOffset, -2, -1, 0, 1, 1);
        else target[targetOffset] = conv(w, c, src, srcOffset, -2, -1, 0, 0, 0);
    }
}

function downsampleHK(kernel: Data.Kernel, dimsX: number[], buffer: Data.DownsamplingBuffer) {
    const { downsampleH: src, downsampleHK: target, slicesWritten } = buffer;

    const kernelSize = kernel.size;
    const sizeH = dimsX[0], sizeK = dimsX[1];
    const targetH = Math.floor((sizeH + 1) / 2);
    const isEven = sizeH % 2 === 0;
    const targetSliceSize = kernelSize * sizeK;
    const targetBaseOffset = slicesWritten % kernelSize;
    const w = 1.0 / kernel.coefficientSum;
    const c = kernel.coefficients;

    for (let k = 0; k < sizeK; k++) {
        let sourceOffset = k * sizeH;        
        let targetOffset = targetBaseOffset + k * kernelSize;        
        target[targetOffset] = conv(w, c, src, sourceOffset, 0, 0, 0, 1, 2);
        for (let h = 1; h < targetH - 1; h++) {
            sourceOffset += 2; targetOffset += targetSliceSize;
            target[targetOffset] = conv(w, c, src, sourceOffset, -2, -1, 0, 1, 2);
        }
        sourceOffset += 2; targetOffset += targetSliceSize;
        if (isEven) target[targetOffset] = conv(w, c, src, sourceOffset, -2, -1, 0, 1, 1);
        else target[targetOffset] = conv(w, c, src, sourceOffset, -2, -1, 0, 0, 0);
    }
    buffer.slicesWritten++;
}

function downsampleSlice(ctx: Data.Context, sampling: Data.Sampling) {
    const dimsU = [sampling.sampleCount[1], Math.floor((sampling.sampleCount[0] + 1) / 2)]
    for (let i = 0, _ii = sampling.blocks.values.length; i < _ii; i++) {
        downsampleH(ctx.kernel, sampling.sampleCount, sampling.blocks.values[i], sampling.blocks.slicesWritten - 1, sampling.downsampling![i].downsampleH);
        downsampleHK(ctx.kernel, dimsU, sampling.downsampling![i]);
    }    
}

function canCollapseBuffer(source: Data.Sampling, finishing: boolean): boolean {
    const buffer = source.downsampling![0];
    const delta = buffer.slicesWritten - buffer.startSliceIndex;
    return (finishing && delta > 0) || (delta > 2 && (delta - 3) % 2 === 0);
}

function collapseBuffer(kernel: Data.Kernel, source: Data.Sampling, target: Data.Sampling, blockSize: number) {
    const downsampling = source.downsampling!;
    const { slicesWritten, startSliceIndex } = downsampling[0];
    const sizeH = target.sampleCount[0], sizeK = target.sampleCount[1], sizeHK = sizeH * sizeK;
    
    const kernelSize = kernel.size;
    const x02 = Math.max(0, startSliceIndex - 2) % kernelSize;
    const x01 = Math.max(0, startSliceIndex - 1) % kernelSize;
    const x0 = startSliceIndex % kernelSize;
    const x1 = Math.min(slicesWritten, startSliceIndex + 1) % kernelSize;
    const x2 = Math.min(slicesWritten, startSliceIndex + 2) % kernelSize;
    const w = 1.0 / kernel.coefficientSum;
    const c = kernel.coefficients;
    
    const channelCount = downsampling.length;
    const valuesBaseOffset = target.blocks.slicesWritten * sizeHK;

    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        const src = downsampling[channelIndex].downsampleHK;
        const values = target.blocks.values[channelIndex];

        for (let k = 0; k < sizeK; k++) {
            const valuesOffset = valuesBaseOffset + k * sizeH;
            for (let h = 0; h < sizeH; h++) {
                const sO = kernelSize * h + kernelSize * k * sizeH;
                const s = conv(w, c, src, sO, x02, x01, x0, x1, x2);
                values[valuesOffset + h] = s;
            }
        }
        downsampling[channelIndex].startSliceIndex += 2;
    }

    target.blocks.slicesWritten++;
    target.blocks.isFull = target.blocks.slicesWritten === blockSize;
}

export function downsampleLayer(ctx: Data.Context) {
    for (let i = 0, _ii = ctx.sampling.length - 1; i < _ii; i++) {
        const s = ctx.sampling[i];
        downsampleSlice(ctx, s);
        if (canCollapseBuffer(s, false)) {
            collapseBuffer(ctx.kernel, s, ctx.sampling[i + 1], ctx.blockSize);
        } else {
            break;
        }
    }
}

export function finalize(ctx: Data.Context) {
    for (let i = 0, _ii = ctx.sampling.length - 1; i < _ii; i++) {
        const s = ctx.sampling[i];
        if (i > 0) downsampleSlice(ctx, s);
        if (canCollapseBuffer(s, true)) {
            collapseBuffer(ctx.kernel, s, ctx.sampling[i + 1], ctx.blockSize);
        } else {
            break;
        }
    }
}
