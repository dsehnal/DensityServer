/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function downsampleX(srcDims, src, srcLOffset, target) {
    var sizeH = srcDims[0], sizeK = srcDims[1], srcBaseOffset = srcLOffset * sizeH * sizeK;
    var targetH = Math.floor((sizeH + 1) / 2);
    var isEven = sizeH % 2 === 0;
    var w = 1.0 / 8.0;
    //console.log(srcDims);
    for (var k = 0; k < sizeK; k++) {
        var srcOffset = srcBaseOffset + k * sizeH;
        var targetOffset = k;
        target[targetOffset] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 2]);
        for (var h = 1; h < targetH - 1; h++) {
            srcOffset += 2;
            target[targetOffset + h * sizeK] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 2]);
        }
        if (isEven)
            target[targetOffset + (targetH - 1) * sizeK] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 1]);
        else
            target[targetOffset + (targetH - 1) * sizeK] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset] + src[srcOffset]);
    }
    //console.log('X', target.slice(0, 10));
}
function _downsampleXY(dimsX, buffer) {
    var src = buffer.downsampleX, target = buffer.downsampleXY, slicesWritten = buffer.slicesWritten;
    //console.log(dimsX);
    var sizeH = dimsX[0], sizeK = dimsX[1];
    var targetH = Math.floor((sizeH + 1) / 2);
    var isEven = sizeH % 2 === 0;
    var targetSliceSize = 4 * sizeK;
    var targetBaseOffset = slicesWritten % 4;
    var w = 1.0 / 8.0;
    for (var k = 0; k < sizeK; k++) {
        var srcOffset = k * sizeH;
        var targetOffset = targetBaseOffset + k * 4;
        target[targetOffset] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 2]);
        for (var h = 1; h < targetH - 1; h++) {
            srcOffset += 2;
            target[targetOffset + h * targetSliceSize] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 2]);
        }
        if (isEven)
            target[targetOffset + (targetH - 1) * targetSliceSize] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset + 1] + src[srcOffset + 1]);
        else
            target[targetOffset + (targetH - 1) * targetSliceSize] = w * (src[srcOffset] + 3 * src[srcOffset] + 3 * src[srcOffset] + src[srcOffset]);
    }
    //console.log('XY', slicesWritten, targetBaseOffset, targetH, target.slice(0, 10));
    buffer.slicesWritten++;
    //console.log(buffer.slicesWritten);
}
function downsampleXY(ctx, sampling) {
    var dimsX = [sampling.sampleCount[1], Math.floor((sampling.sampleCount[0] + 1) / 2)];
    for (var i = 0, _ii = sampling.blocks.values.length; i < _ii; i++) {
        downsampleX(sampling.sampleCount, sampling.blocks.values[i], sampling.blocks.slicesWritten - 1, sampling.downsampling[i].downsampleX);
        _downsampleXY(dimsX, sampling.downsampling[i]);
    }
}
function canCollapseBuffer(source, finishing) {
    var buffer = source.downsampling[0];
    var delta = buffer.slicesWritten - buffer.startSliceIndex;
    return (finishing && delta > 0) || (delta > 2 && (delta - 3) % 2 === 0);
}
function collapseBuffer(source, target, blockSize) {
    var downsampling = source.downsampling;
    var _a = downsampling[0], slicesWritten = _a.slicesWritten, startSliceIndex = _a.startSliceIndex;
    var sizeH = target.sampleCount[0], sizeK = target.sampleCount[1], sizeHK = sizeH * sizeK;
    var x0 = Math.max(0, startSliceIndex - 1) % 4;
    var x1 = startSliceIndex % 4;
    var x2 = Math.min(slicesWritten, startSliceIndex + 1) % 4;
    var x3 = Math.min(slicesWritten, startSliceIndex + 1) % 4;
    var w = 1.0 / 8.0;
    var channelCount = downsampling.length;
    var valuesBaseOffset = target.blocks.slicesWritten * sizeHK;
    for (var channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        var downsampleXY_1 = downsampling[channelIndex].downsampleXY;
        var values = target.blocks.values[channelIndex];
        for (var k = 0; k < sizeK; k++) {
            var valuesOffset = valuesBaseOffset + k * sizeH;
            for (var h = 0; h < sizeH; h++) {
                var srcOffset = 4 * h + 4 * k * sizeH;
                var s = w * (downsampleXY_1[srcOffset + x0] + 3 * downsampleXY_1[srcOffset + x1] + 3 * downsampleXY_1[srcOffset + x2] + downsampleXY_1[srcOffset + x3]);
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
        downsampleXY(ctx, s);
        if (canCollapseBuffer(s, false)) {
            collapseBuffer(s, ctx.sampling[i + 1], ctx.blockSize);
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
            collapseBuffer(s, ctx.sampling[i + 1], ctx.blockSize);
        }
        else {
            break;
        }
    }
}
exports.finalize = finalize;
