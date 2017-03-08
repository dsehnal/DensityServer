/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function tr(v, max) {
    if (v < 0)
        return 0;
    if (v > max - 1)
        return max - 1;
    return v;
}
/**
 * Map from L-th slice in src to an array of dimensions (srcDims[1], (srcDims[0] / 2), 1)
 */
function downsample(src, target, blockSize) {
    var sizeH = src.sampleCount[0], sizeK = src.sampleCount[1], srcBaseOffset = (src.blocks.slicesWritten - 1) * sizeH * sizeK;
    var targetH = Math.floor((sizeH + 1) / 2), tarBaseOffset = (target.blocks.slicesWritten) * targetH * sizeK;
    //const w = 1.0 / (1 + 2 * 68+ 1);
    for (var chan = 0; chan < src.blocks.values.length; chan++) {
        var s = src.blocks.values[chan];
        var t = target.blocks.values[chan];
        for (var k = 0; k < sizeK; k++) {
            for (var h = 0; h < targetH; h++) {
                var hh = 2 * h;
                var o = srcBaseOffset + k * sizeH;
                // t[tarBaseOffset + k * targetH + h] = //s[srcBaseOffset + k * sizeH + hh];                
                //     1 / 4 * (
                //      s[o + tr(hh - 1, sizeH)] + 
                //          1 * (
                //             s[o + tr(hh, sizeH)] 
                //             + s[o + tr(hh, sizeH + 1)]) 
                //          + s[o + tr(hh, sizeH + 2)]);
                t[tarBaseOffset + k * targetH + h] =
                    1 / 16 * (+s[o + tr(hh - 2, sizeH)]
                        + 4 * s[o + tr(hh - 1, sizeH)]
                        + 6 * s[o + tr(hh, sizeH)]
                        + 4 * s[o + tr(hh + 1, sizeH)]
                        + s[o + tr(hh + 2, sizeH)]);
            }
        }
    }
    target.blocks.slicesWritten++;
    target.blocks.isFull = target.blocks.slicesWritten === blockSize;
    //console.log('X', target);
}
exports.downsample = downsample;
