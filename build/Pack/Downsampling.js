/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The functions downsampleH and downsampleHK both essentially do the
 * same thing: downsample along H (1st axis in axis order) and K (2nd axis in axis order) axes respectively.
 *
 * The reason there are two copies of almost the same code is performance:
 * Both functions use a different memory layout to improve cache coherency
 *  - downsampleU uses the H axis as the fastest moving one
 *  - downsampleUV uses the K axis as the fastest moving one
 */
function conv(w, c, src, b, i0, i1, i2, i3, i4) {
    return w * (c[0] * src[b + i0] + c[1] * src[b + i1] + c[2] * src[b + i2] + c[3] * src[b + i3] + c[4] * src[b + i4]);
}
/**
 * Map from L-th slice in src to an array of dimensions (srcDims[1], (srcDims[0] / 2), 1),
 * flipping the 1st and 2nd axis in the process to optimize cache coherency for _downsampleUV call.
 */
function downsampleH(kernel, srcDims, src, srcLOffset, target) {
    var sizeH = srcDims[0], sizeK = srcDims[1], srcBaseOffset = srcLOffset * sizeH * sizeK;
    var targetH = Math.floor((sizeH + 1) / 2);
    var isEven = sizeH % 2 === 0;
    var w = 1.0 / kernel.coefficientSum;
    var c = kernel.coefficients;
    for (var k = 0; k < sizeK; k++) {
        var srcOffset = srcBaseOffset + k * sizeH;
        var targetOffset = k;
        target[targetOffset] = conv(w, c, src, srcOffset, 0, 0, 0, 1, 2);
        for (var h = 1; h < targetH - 1; h++) {
            srcOffset += 2;
            targetOffset += sizeK;
            target[targetOffset] = conv(w, c, src, srcOffset, -2, -1, 0, 1, 2);
        }
        srcOffset += 2;
        targetOffset += sizeK;
        if (isEven)
            target[targetOffset] = conv(w, c, src, srcOffset, -2, -1, 0, 1, 1);
        else
            target[targetOffset] = conv(w, c, src, srcOffset, -2, -1, 0, 0, 0);
    }
}
function downsampleHK(kernel, dimsX, buffer) {
    var src = buffer.downsampleH, target = buffer.downsampleHK, slicesWritten = buffer.slicesWritten;
    var kernelSize = kernel.size;
    var sizeH = dimsX[0], sizeK = dimsX[1];
    var targetH = Math.floor((sizeH + 1) / 2);
    var isEven = sizeH % 2 === 0;
    var targetSliceSize = kernelSize * sizeK;
    var targetBaseOffset = slicesWritten % kernelSize;
    var w = 1.0 / kernel.coefficientSum;
    var c = kernel.coefficients;
    for (var k = 0; k < sizeK; k++) {
        var sourceOffset = k * sizeH;
        var targetOffset = targetBaseOffset + k * kernelSize;
        target[targetOffset] = conv(w, c, src, sourceOffset, 0, 0, 0, 1, 2);
        for (var h = 1; h < targetH - 1; h++) {
            sourceOffset += 2;
            targetOffset += targetSliceSize;
            target[targetOffset] = conv(w, c, src, sourceOffset, -2, -1, 0, 1, 2);
        }
        sourceOffset += 2;
        targetOffset += targetSliceSize;
        if (isEven)
            target[targetOffset] = conv(w, c, src, sourceOffset, -2, -1, 0, 1, 1);
        else
            target[targetOffset] = conv(w, c, src, sourceOffset, -2, -1, 0, 0, 0);
    }
    buffer.slicesWritten++;
}
function downsampleSlice(ctx, sampling) {
    var dimsU = [sampling.sampleCount[1], Math.floor((sampling.sampleCount[0] + 1) / 2)];
    for (var i = 0, _ii = sampling.blocks.values.length; i < _ii; i++) {
        downsampleH(ctx.kernel, sampling.sampleCount, sampling.blocks.values[i], sampling.blocks.slicesWritten - 1, sampling.downsampling[i].downsampleH);
        downsampleHK(ctx.kernel, dimsU, sampling.downsampling[i]);
    }
}
function canCollapseBuffer(source, finishing) {
    var buffer = source.downsampling[0];
    var delta = buffer.slicesWritten - buffer.startSliceIndex;
    return (finishing && delta > 0) || (delta > 2 && (delta - 3) % 2 === 0);
}
function collapseBuffer(kernel, source, target, blockSize) {
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
    var channelCount = downsampling.length;
    var valuesBaseOffset = target.blocks.slicesWritten * sizeHK;
    for (var channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        var src = downsampling[channelIndex].downsampleHK;
        var values = target.blocks.values[channelIndex];
        for (var k = 0; k < sizeK; k++) {
            var valuesOffset = valuesBaseOffset + k * sizeH;
            for (var h = 0; h < sizeH; h++) {
                var sO = kernelSize * h + kernelSize * k * sizeH;
                var s = conv(w, c, src, sO, x02, x01, x0, x1, x2);
                values[valuesOffset + h] = s;
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
        downsampleSlice(ctx, s);
        if (canCollapseBuffer(s, false)) {
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
            downsampleSlice(ctx, s);
        if (canCollapseBuffer(s, true)) {
            collapseBuffer(ctx.kernel, s, ctx.sampling[i + 1], ctx.blockSize);
        }
        else {
            break;
        }
    }
}
exports.finalize = finalize;
