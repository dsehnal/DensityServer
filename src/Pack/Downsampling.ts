/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'
import * as DataFormat from '../Common/DataFormat'

function downsampleX(srcDims: number[], src: DataFormat.ValueArray, srcLOffset: number, target: DataFormat.ValueArray) {
    const sizeH = srcDims[0], sizeK = srcDims[1], srcBaseOffset = srcLOffset * sizeH * sizeK;
    const targetH = Math.floor((sizeH + 1) / 2);
    const isEven = sizeH % 2 === 0;
    const w = 1.0 / 8.0;

    //console.log(srcDims);

    for (let k = 0; k < sizeK; k++) {
        let srcOffset = srcBaseOffset + k * sizeH;        
        const targetOffset = k;
        target[targetOffset] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 2]);
        for (let h = 1; h < targetH - 1; h++) {
            srcOffset += 2;
            target[targetOffset + h * sizeK] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 2]);
        }
        if (isEven) target[targetOffset + (targetH - 1) * sizeK] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 1]);
        else target[targetOffset + (targetH - 1) * sizeK] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset] + src[srcOffset]);
    }
    
    //console.log('X', target.slice(0, 10));
}

function _downsampleXY(dimsX: number[], buffer: Data.DownsamplingBuffer) {
    const { downsampleX: src, downsampleXY: target, slicesWritten } = buffer;

    //console.log(dimsX);

    const sizeH = dimsX[0], sizeK = dimsX[1];
    const targetH = Math.floor((sizeH + 1) / 2);
    const isEven = sizeH % 2 === 0;
    const targetSliceSize = 4 * sizeK;
    const targetBaseOffset = slicesWritten % 4;
    const w = 1.0 / 8.0;

    for (let k = 0; k < sizeK; k++) {
        let srcOffset = k * sizeH;        
        const targetOffset = targetBaseOffset + k * 4;        
        target[targetOffset] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 2]);
        for (let h = 1; h < targetH - 1; h++) {
            srcOffset += 2;
            target[targetOffset + h * targetSliceSize] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 2]);
        }
        if (isEven) target[targetOffset + (targetH - 1) * targetSliceSize] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 1]);
        else target[targetOffset + (targetH - 1) * targetSliceSize] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset] + src[srcOffset]);
    }
    //console.log('XY', slicesWritten, targetBaseOffset, targetH, target.slice(0, 10));
    buffer.slicesWritten++;
    //console.log(buffer.slicesWritten);
}

function downsampleXY(ctx: Data.Context, sampling: Data.Sampling) {
    const dimsX = [sampling.sampleCount[1], Math.floor((sampling.sampleCount[0] + 1) / 2)]
    for (let i = 0, _ii = sampling.blocks.values.length; i < _ii; i++) {
        downsampleX(sampling.sampleCount, sampling.blocks.values[i], sampling.blocks.slicesWritten - 1, sampling.downsampling![i].downsampleX);
        _downsampleXY(dimsX, sampling.downsampling![i]);
    }    
}


function canCollapseBuffer(source: Data.Sampling, finishing: boolean): boolean {
    const buffer = source.downsampling![0];
    const delta = buffer.slicesWritten - buffer.startSliceIndex;
    return (finishing && delta > 0) || (delta > 2 && (delta - 3) % 2 === 0);
}

function collapseBuffer(source: Data.Sampling, target: Data.Sampling, blockSize: number) {
    const downsampling = source.downsampling!;
    const { slicesWritten, startSliceIndex } = downsampling[0];
    const sizeH = target.sampleCount[0], sizeK = target.sampleCount[1], sizeHK = sizeH * sizeK;
    
    const x0 = Math.max(0, startSliceIndex - 1) % 4;
    const x1 = startSliceIndex % 4;
    const x2 = Math.min(slicesWritten, startSliceIndex + 1) % 4;
    const x3 = Math.min(slicesWritten, startSliceIndex + 1) % 4;
    const w = 1.0 / 8.0;
    
    const channelCount = downsampling.length;
    const valuesBaseOffset = target.blocks.slicesWritten * sizeHK;

    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        const downsampleXY = downsampling[channelIndex].downsampleXY;
        const values = target.blocks.values[channelIndex];

        for (let k = 0; k < sizeK; k++) {
            const valuesOffset = valuesBaseOffset + k * sizeH;
            for (let h = 0; h < sizeH; h++) {
                const srcOffset = 4 * h + 4 * k * sizeH;
                const s = w * (downsampleXY[srcOffset + x0] + 3 * downsampleXY[srcOffset + x1] + 3 * downsampleXY[srcOffset + x2] + downsampleXY[srcOffset + x3]);
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
        downsampleXY(ctx, s);
        if (canCollapseBuffer(s, false)) {
            collapseBuffer(s, ctx.sampling[i + 1], ctx.blockSize);
        } else {
            break;
        }
    }
}

export function finalize(ctx: Data.Context) {
    for (let i = 0, _ii = ctx.sampling.length - 1; i < _ii; i++) {
        const s = ctx.sampling[i];
        if (i > 0) downsampleXY(ctx, s);
        if (canCollapseBuffer(s, true)) {
            collapseBuffer(s, ctx.sampling[i + 1], ctx.blockSize);
        } else {
            break;
        }
    }
}
