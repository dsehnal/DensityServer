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
var File = require("../Utils/File");
function createContext(filename, progress, sources, blockSize, sampleRate) {
    return __awaiter(this, void 0, void 0, function () {
        var extent, samples, downsampleSliceSize, downsampleSliceRate, downsampleBufferSize, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    extent = sources[0].header.extent;
                    samples = [Math.ceil(extent[0] / sampleRate), Math.ceil(extent[1] / sampleRate), Math.ceil(extent[2] / sampleRate)];
                    downsampleSliceSize = samples[0] * samples[1] * blockSize;
                    downsampleSliceRate = Math.ceil((samples[2] * sampleRate / extent[2]) * sampleRate);
                    downsampleBufferSize = extent[0] * extent[1] * downsampleSliceRate;
                    _a = {};
                    return [4 /*yield*/, File.createFile(filename)];
                case 1: 
                // 2 * Math.ceil(sampleRate * sampleCounts[0] / extent[0])
                return [2 /*return*/, (_a.file = _b.sent(),
                        _a.sigmasOffset = 0,
                        _a.sources = sources,
                        _a.blockHeader = void 0,
                        _a.progress = progress,
                        _a.blockSize = blockSize,
                        _a.samples = samples,
                        _a.blockCounts = [Math.ceil(samples[0] / blockSize) | 0, Math.ceil(samples[1] / blockSize) | 0, Math.ceil(samples[2] / blockSize) | 0],
                        _a.cubeBuffer = new Buffer(new ArrayBuffer(sources[0].layer.buffer.elementByteSize * blockSize * blockSize * blockSize)),
                        //downsampledBuffer: sources.map(_ => new Float32Array(downsampleBufferSize)),
                        //downsampledSlices: sources.map(_ => new Float32Array(downsampleSliceSize)),
                        _a.sampleRate = sampleRate,
                        _a.currentSlice = 0,
                        _a.endSlice = 0,
                        _a)];
            }
        });
    });
}
exports.createContext = createContext;
function lerp(ctx, index, u, v, w) {
    var data = ctx.downsampleBuffer[index];
    var extent = ctx.extent;
    var u0 = Math.floor(u), u1 = Math.ceil(u), tU = u - u0;
    var v0 = Math.floor(v), v1 = Math.ceil(v), tV = v - v0;
    var w0 = Math.floor(w), w1 = Math.ceil(w), tW = w - w0;
    // k * extent[0] * extent[1] + j * extent[0] + i;
    var c00 = data[w0 * extent[0] * extent[1] + v0 * extent[0] + u0] * (1 - tU) + data[w0 * extent[0] * extent[1] + v0 * extent[0] + u1] * tU;
    var c01 = data[w1 * extent[0] * extent[1] + v0 * extent[0] + u0] * (1 - tU) + data[w1 * extent[0] * extent[1] + v0 * extent[0] + u1] * tU;
    var c10 = data[w0 * extent[0] * extent[1] + v1 * extent[0] + u0] * (1 - tU) + data[w0 * extent[0] * extent[1] + v1 * extent[0] + u1] * tU;
    var c11 = data[w1 * extent[0] * extent[1] + v1 * extent[0] + u0] * (1 - tU) + data[w1 * extent[0] * extent[1] + v1 * extent[0] + u1] * tU;
    var c0 = c00 * (1 - tV) + c10 * tV;
    var c1 = c01 * (1 - tV) + c11 * tV;
    return c0 * (1 - tW) + c1 * tW;
}
function sumBlock(ctx, index, u, v) {
    var sampleRate = ctx.sampleRate, sampleDelta = ctx.sampleDelta;
    var startH = u * sampleRate, endH = startH + sampleRate;
    var startK = v * sampleRate, endK = startK + sampleRate;
    var dH = sampleDelta[0], dK = sampleDelta[1], dL = sampleDelta[2];
    var sum = 0;
    for (var l = 0; l < sampleRate; l++) {
        var oL = l * dL;
        for (var k = startK; k < endK; k++) {
            var oK = k * dK;
            for (var h = startH; h < endH; h++) {
                var oH = h * dH;
                sum += lerp(ctx, index, oH, oK, oL);
            }
        }
    }
    return sum / (sampleRate * sampleRate * sampleRate);
}
function downsampleSlice(ctx) {
    var samples = ctx.samples, sampleRate = ctx.sampleRate, downsampleBuffer = ctx.downsampleBuffer, downsampledSlices = ctx.downsampledSlices;
    var cU = samples[0];
    var cV = samples[1];
    var downsampleRow = ctx.currentDownsampledRow;
    for (var index = 0; index < ctx.sources.length; index++) {
        var downsampledSlice = downsampledSlices[index];
        for (var v = 0; v < cV; v++) {
            for (var u = 0; u < cU; u++) {
                var sum = sumBlock(ctx, index, u, v);
                downsampledSlice[ctx.currentDownsampledRow * samples[0] * samples[1] + v * samples[0] + u] = sum;
            }
        }
    }
    ctx.currentDownsampledRow++;
}
function prepareNextSlice(ctx) {
    return false;
}
function canWriteBlocks(ctx) {
    return false;
}
function writeBlocks(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    });
}
function processLayer(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!prepareNextSlice(ctx)) return [3 /*break*/, 3];
                    downsampleSlice(ctx);
                    if (!canWriteBlocks(ctx)) return [3 /*break*/, 2];
                    return [4 /*yield*/, writeBlocks(ctx)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [3 /*break*/, 0];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.processLayer = processLayer;
