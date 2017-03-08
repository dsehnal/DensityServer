/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'
import * as DataFormat from '../Common/DataFormat'

/**
 * Map from L-th slice in src to an array of dimensions (srcDims[1], (srcDims[0] / 2), 1)
 */
function downsampleX(kernel: Data.Kernel, srcDims: number[], src: DataFormat.ValueArray, srcLOffset: number, target: DataFormat.ValueArray) {
    const sizeH = srcDims[0], sizeK = srcDims[1], srcBaseOffset = srcLOffset * sizeH * sizeK;
    const targetH = Math.floor((sizeH + 1) / 2);
    const isEven = sizeH % 2 === 0;
    const w = 1.0 / kernel.coefficientSum;
    const c = kernel.coefficients;

    //console.log(srcDims);

    for (let k = 0; k < sizeK; k++) {
        let sO = srcBaseOffset + k * sizeH;        
        const tO = k;
        target[tO] = w * (c[0] * src[sO] + c[1] * src[sO] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 2]);
        if (isNaN(target[tO])) console.log('sadasdasdasdadadas', srcDims, src[sO], srcLOffset );
        for (let h = 1; h < targetH - 1; h++) {
            sO += 2;
            target[tO + h * sizeK] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 2]);
        }        
        sO += 2;
        if (isEven) target[tO + (targetH - 1) * sizeK] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 1]);
        else target[tO + (targetH - 1) * sizeK] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO] + c[4] * src[sO]);
    }
    
    //console.log('X', target);
}

function _downsampleXY(kernel: Data.Kernel, dimsX: number[], buffer: Data.DownsamplingBuffer) {
    const { downsampleX: src, downsampleXY: target, slicesWritten } = buffer;

    //console.log(dimsX);

    const kernelSize = kernel.size;
    const sizeH = dimsX[0], sizeK = dimsX[1];
    const targetH = Math.floor((sizeH + 1) / 2);
    const isEven = sizeH % 2 === 0;
    const targetSliceSize = kernelSize * sizeK;
    const targetBaseOffset = slicesWritten % kernelSize;
    const w = 1.0 / kernel.coefficientSum;
    const c = kernel.coefficients;

    for (let k = 0; k < sizeK; k++) {
        let sO = k * sizeH;        
        const tO = targetBaseOffset + k * kernelSize;        
        target[tO] = w * (c[0] * src[sO] + c[1] * src[sO] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 2]);
        for (let h = 1; h < targetH - 1; h++) {
            sO += 2;
            target[tO + h * targetSliceSize] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 2]);
        }
        sO += 2;
        if (isEven) target[tO + (targetH - 1) * targetSliceSize] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 1]);
        else target[tO + (targetH - 1) * targetSliceSize] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO] + c[4] * src[sO]);
    }
    //console.log('XY', slicesWritten, targetBaseOffset, targetH, target.slice(0, 10));
    buffer.slicesWritten++;
    //console.log(buffer.slicesWritten);
}

function downsampleXY(ctx: Data.Context, sampling: Data.Sampling) {
    //console.log('downsampleXY');
    const dimsX = [sampling.sampleCount[1], Math.floor((sampling.sampleCount[0] + 1) / 2)]
    for (let i = 0, _ii = sampling.blocks.values.length; i < _ii; i++) {
        downsampleX(ctx.kernel, sampling.sampleCount, sampling.blocks.values[i], sampling.blocks.slicesWritten - 1, sampling.downsampling![i].downsampleX);
        _downsampleXY(ctx.kernel, dimsX, sampling.downsampling![i]);
    }    
}


function canCollapseBuffer(source: Data.Sampling, finishing: boolean): boolean {
    const buffer = source.downsampling![0];
    const delta = buffer.slicesWritten - buffer.startSliceIndex;
    return (finishing && delta > 0) || (delta > 2 && (delta - 3) % 2 === 0);
}

function collapseBuffer(kernel: Data.Kernel, source: Data.Sampling, target: Data.Sampling, blockSize: number) {
    //console.log('collapse');
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
    
    //console.log(x0, x1, x2, x3);

    const channelCount = downsampling.length;
    const valuesBaseOffset = target.blocks.slicesWritten * sizeHK;

    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        const src = downsampling[channelIndex].downsampleXY;
        const values = target.blocks.values[channelIndex];

        for (let k = 0; k < sizeK; k++) {
            const valuesOffset = valuesBaseOffset + k * sizeH;
            for (let h = 0; h < sizeH; h++) {
                const sO = kernelSize * h + kernelSize * k * sizeH;
                const s = w * (c[0] * src[sO + x02] + c[1] * src[sO + x01] + c[2] * src[sO + x0] + c[3] * src[sO + x1] + c[4] * src[sO + x2]);
                values[valuesOffset + h] = s;
                if (isNaN(s)) {
                    console.log('NANANANANANANANANA', source.rate, target.rate, x02, x01, x0, x1, x2);
                    throw '';
                } 
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
        console.log('downsample', i);
        downsampleXY(ctx, s);
        if (canCollapseBuffer(s, false)) {
            console.log('collapse', i);
            collapseBuffer(ctx.kernel, s, ctx.sampling[i + 1], ctx.blockSize);
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
            console.log('collapse fin');
            collapseBuffer(ctx.kernel, s, ctx.sampling[i + 1], ctx.blockSize);
        } else {
            break;
        }
    }
}
