/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Map from L-th slice in src to an array of dimensions (srcDims[1], (srcDims[0] / 2), 1)
 */
function downsampleX(kernel, srcDims, src, srcLOffset, target) {
    var sizeH = srcDims[0], sizeK = srcDims[1], srcBaseOffset = srcLOffset * sizeH * sizeK;
    var targetH = Math.floor((sizeH + 1) / 2);
    var isEven = sizeH % 2 === 0;
    var w = 1.0 / kernel.coefficientSum;
    var c = kernel.coefficients;
    //console.log(srcDims);
    for (var k = 0; k < sizeK; k++) {
        var sO = srcBaseOffset + k * sizeH;
        var tO = k;
        target[tO] = w * (c[0] * src[sO] + c[1] * src[sO] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 2]);
        if (isNaN(target[tO]))
            console.log('sadasdasdasdadadas', srcDims, src[sO], srcLOffset);
        for (var h = 1; h < targetH - 1; h++) {
            sO += 2;
            target[tO + h * sizeK] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 2]);
        }
        sO += 2;
        if (isEven)
            target[tO + (targetH - 1) * sizeK] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 1]);
        else
            target[tO + (targetH - 1) * sizeK] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO] + c[4] * src[sO]);
    }
    //console.log('X', target);
}
function _downsampleXY(kernel, dimsX, buffer) {
    var src = buffer.downsampleX, target = buffer.downsampleXY, slicesWritten = buffer.slicesWritten;
    //console.log(dimsX);
    var kernelSize = kernel.size;
    var sizeH = dimsX[0], sizeK = dimsX[1];
    var targetH = Math.floor((sizeH + 1) / 2);
    var isEven = sizeH % 2 === 0;
    var targetSliceSize = kernelSize * sizeK;
    var targetBaseOffset = slicesWritten % kernelSize;
    var w = 1.0 / kernel.coefficientSum;
    var c = kernel.coefficients;
    for (var k = 0; k < sizeK; k++) {
        var sO = k * sizeH;
        var tO = targetBaseOffset + k * kernelSize;
        target[tO] = w * (c[0] * src[sO] + c[1] * src[sO] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 2]);
        for (var h = 1; h < targetH - 1; h++) {
            sO += 2;
            target[tO + h * targetSliceSize] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 2]);
        }
        sO += 2;
        if (isEven)
            target[tO + (targetH - 1) * targetSliceSize] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO + 1] + c[4] * src[sO + 1]);
        else
            target[tO + (targetH - 1) * targetSliceSize] = w * (c[0] * src[sO - 2] + c[1] * src[sO - 1] + c[2] * src[sO] + c[3] * src[sO] + c[4] * src[sO]);
    }
    //console.log('XY', slicesWritten, targetBaseOffset, targetH, target.slice(0, 10));
    buffer.slicesWritten++;
    //console.log(buffer.slicesWritten);
}
function downsampleXY(ctx, sampling) {
    //console.log('downsampleXY');
    var dimsX = [sampling.sampleCount[1], Math.floor((sampling.sampleCount[0] + 1) / 2)];
    for (var i = 0, _ii = sampling.blocks.values.length; i < _ii; i++) {
        downsampleX(ctx.kernel, sampling.sampleCount, sampling.blocks.values[i], sampling.blocks.slicesWritten - 1, sampling.downsampling[i].downsampleX);
        _downsampleXY(ctx.kernel, dimsX, sampling.downsampling[i]);
    }
}
function canCollapseBuffer(source, finishing) {
    var buffer = source.downsampling[0];
    var delta = buffer.slicesWritten - buffer.startSliceIndex;
    return (finishing && delta > 0) || (delta > 2 && (delta - 3) % 2 === 0);
}
function collapseBuffer(kernel, source, target, blockSize) {
    //console.log('collapse');
    var downsampling = source.downsampling;
    var _a = downsampling[0], slicesWritten = _a.slicesWritten, startSliceIndex = _a.startSliceIndex;
    var sizeH = target.sampleCount[0], sizeK = target.sampleCount[1], sizeHK = sizeH * sizeK;
    var kernelSize = kernel.size;
    var x02 = Math.max(0, startSliceIndex - 2) % kernelSize;
    var x01 = Math.max(0, startSliceIndex - 1) % kernelSize;
    var x0 = startSliceIndex % kernelSize;
    var x1 = Math.min(slicesWritten, startSliceIndex + 1) % kernelSize;
    var x2 = Math.min(slicesWritten, startSliceIndex + 2) % kernelSize;
    var w = 1.0 / kernel.coefficientSum;
    var c = kernel.coefficients;
    //console.log(x0, x1, x2, x3);
    var channelCount = downsampling.length;
    var valuesBaseOffset = target.blocks.slicesWritten * sizeHK;
    for (var channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        var src = downsampling[channelIndex].downsampleXY;
        var values = target.blocks.values[channelIndex];
        for (var k = 0; k < sizeK; k++) {
            var valuesOffset = valuesBaseOffset + k * sizeH;
            for (var h = 0; h < sizeH; h++) {
                var sO = kernelSize * h + kernelSize * k * sizeH;
                var s = w * (c[0] * src[sO + x02] + c[1] * src[sO + x01] + c[2] * src[sO + x0] + c[3] * src[sO + x1] + c[4] * src[sO + x2]);
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
function downsampleLayer(ctx) {
    for (var i = 0, _ii = ctx.sampling.length - 1; i < _ii; i++) {
        var s = ctx.sampling[i];
        console.log('downsample', i);
        downsampleXY(ctx, s);
        if (canCollapseBuffer(s, false)) {
            console.log('collapse', i);
            collapseBuffer(ctx.kernel, s, ctx.sampling[i + 1], ctx.blockSize);
        }
        else {
            break;
        }
    }
}
exports.downsampleLayer = downsampleLayer;
function finalize(ctx) {
    for (var i = 0, _ii = ctx.sampling.length - 1; i < _ii; i++) {
        var s = ctx.sampling[i];
        if (i > 0)
            downsampleXY(ctx, s);
        if (canCollapseBuffer(s, true)) {
            console.log('collapse fin');
            collapseBuffer(ctx.kernel, s, ctx.sampling[i + 1], ctx.blockSize);
        }
        else {
            break;
        }
    }
}
exports.finalize = finalize;
