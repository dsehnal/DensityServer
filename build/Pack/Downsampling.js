/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function lerp(cube, tU, tV, tW) {
    var tU1 = 1 - tU, tV1 = 1 - tV;
    return ((cube[0] * tU1 + cube[4] * tU) * tV1 +
        (cube[2] * tU1 + cube[6] * tU) * tV) * (1 - tW)
        + ((cube[1] * tU1 + cube[5] * tU) * tV1 +
            (cube[3] * tU1 + cube[7] * tU) * tV) * tW;
}
function fillLerpCube(ctx, values, i, j, k) {
    var z0Offset = ctx.z0Offset, z1Offset = ctx.z1Offset, sizeI = ctx.sizeI, cube = ctx.cube;
    cube[0] = values[z0Offset + j * sizeI + i];
    cube[1] = values[z1Offset + j * sizeI + i];
    cube[2] = values[z0Offset + (j + 1) * sizeI + i];
    cube[3] = values[z1Offset + (j + 1) * sizeI + i];
    cube[4] = values[z0Offset + j * sizeI + i + 1];
    cube[5] = values[z1Offset + j * sizeI + i + 1];
    cube[6] = values[z0Offset + (j + 1) * sizeI + i + 1];
    cube[7] = values[z1Offset + (j + 1) * sizeI + i + 1];
}
/** Advances sampling rate K */
function advanceSamplingKbase(sampling, ctx) {
    var delta = sampling.delta, sampleCount = sampling.sampleCount, rate = sampling.rate;
    var lerpCube = ctx.lerpCube;
    var mI = sampleCount[0] - 1, mJ = sampleCount[1] - 1, mK = rate - 1;
    var cubeI = 0, cubeJ = 0, cubeK = 0;
    var channelIndex = 0;
    for (var _i = 0, _a = ctx.channels; _i < _a.length; _i++) {
        var channel = _a[_i];
        var target = sampling.blocksLayer.values[channelIndex];
        fillLerpCube(lerpCube, channel.layer.values, cubeI, cubeJ, cubeK);
        var x = 0.0, y = 0.0, z = delta[2] * sampling.blocksLayer.lastProcessedSlice;
        for (var k = 0; k < mK; k++) {
            var w = z - Math.floor(z);
            for (var j = 0; j < mJ; j++) {
                var v = y - Math.floor(y);
                for (var i = 0; i < mI; i++) {
                    var u = x - Math.floor(x);
                    target[0] = lerp(lerpCube.cube, u, v, w);
                    x += delta[0];
                    var c_1 = Math.floor(x);
                    if (c_1 !== cubeI) {
                        cubeI = c_1;
                        fillLerpCube(lerpCube, channel.layer.values, cubeI, cubeJ, cubeK);
                    }
                }
                y += delta[1];
                var c_2 = Math.floor(y);
                if (c_2 !== cubeJ) {
                    cubeJ = c_2;
                    fillLerpCube(lerpCube, channel.layer.values, cubeI, cubeJ, cubeK);
                }
            }
            z += delta[2];
            var c = Math.floor(z);
            if (c !== cubeI) {
                cubeK = c;
                fillLerpCube(lerpCube, channel.layer.values, cubeI, cubeJ, cubeK);
                lerpCube.z0Offset = (lerpCube.z0Offset + ctx.lerpCube.sizeIJ) % channel.layer.values.length;
                lerpCube.z1Offset = (lerpCube.z1Offset + ctx.lerpCube.sizeIJ) % channel.layer.values.length;
            }
        }
        channelIndex++;
    }
}
/** Advances sampling rate K */
function advanceSamplingK(K, sampling, ctx) {
    // TODO: compute how many times we have advanced.
    // TODO: add the base to the multipliers
    var mult = 3 * sampling.length;
    for (var m = 0; m < mult; m++) {
        advanceSamplingKbase(sampling[0], ctx);
    }
}
exports.advanceSamplingK = advanceSamplingK;
