/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
    return __awaiter(this, void 0, void 0, function () {
        var mult, m;
        return __generator(this, function (_a) {
            mult = 3 * sampling.length;
            for (m = 0; m < mult; m++) {
                advanceSamplingKbase(sampling[0], ctx);
            }
            return [2 /*return*/];
        });
    });
}
exports.advanceSamplingK = advanceSamplingK;
