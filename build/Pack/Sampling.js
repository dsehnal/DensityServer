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
var CCP4 = require("./CCP4");
var Data = require("./DataModel");
var File = require("../Common/File");
var DataFormat = require("../Common/DataFormat");
function getSamplingRates(baseSampleCount, blockSize) {
    var ret = [];
    for (var i = 1; i <= 16; i++)
        ret.push(i);
    return ret;
    //return [1, 2, 3, 4, 5, 6, 7, 8];
}
function createBuffer(type, size) {
    if (type === 0 /* Float32 */) {
        return new Float32Array(new ArrayBuffer(4 * size));
    }
    return new Int8Array(new ArrayBuffer(size));
}
function createBlocksLayer(sampleCount, blockSize, valueType, numChannels) {
    var values = [];
    for (var i = 0; i < numChannels; i++)
        values[i] = createBuffer(valueType, sampleCount[0] * sampleCount[1] * blockSize);
    return {
        dimensions: [sampleCount[0], sampleCount[1], blockSize],
        values: values,
        buffers: values.map(function (xs) { return new Buffer(xs.buffer); }),
        lastProcessedSlice: 0,
        slicesWritten: 0,
        isFull: false
    };
}
function createSampling(valueType, numChannels, baseSampleCount, blockSize, rate) {
    var sampleCount = baseSampleCount.map(function (s) { return Math.ceil(s / rate); });
    var delta = [
        baseSampleCount[0] / (rate * sampleCount[0] - 1),
        baseSampleCount[1] / (rate * sampleCount[1] - 1),
        baseSampleCount[2] / (rate * sampleCount[2] - 1)
    ];
    return {
        rate: rate,
        sampleCount: sampleCount,
        delta: delta,
        blocksLayer: createBlocksLayer(sampleCount, blockSize, valueType, numChannels),
        dataSliceIndex: 0,
        byteOffset: 0,
        byteSize: numChannels * sampleCount[0] * sampleCount[1] * sampleCount[2] * DataFormat.getValueByteSize(valueType),
        writeByteOffset: 0
    };
}
function createLerpCube(sampleCounts) {
    return {
        cube: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
        z0Offset: 0,
        z1Offset: 0,
        sizeI: sampleCounts[0],
        sizeIJ: sampleCounts[0] * sampleCounts[1]
    };
}
function createContext(filename, channels, blockSize, isPeriodic) {
    return __awaiter(this, void 0, void 0, function () {
        var header, rates, valueType, cubeBuffer, litteEndianCubeBuffer, ctx, _a, addedSamplings, k, current, _i, _b, s, byteOffset, _c, _d, s;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    header = channels[0].header;
                    rates = getSamplingRates(channels[0].header.extent, blockSize);
                    valueType = CCP4.getValueType(header);
                    cubeBuffer = new Buffer(new ArrayBuffer(channels.length * blockSize * blockSize * blockSize * DataFormat.getValueByteSize(valueType)));
                    litteEndianCubeBuffer = File.isNativeEndianLittle
                        ? cubeBuffer
                        : new Buffer(new ArrayBuffer(channels.length * blockSize * blockSize * blockSize * DataFormat.getValueByteSize(valueType)));
                    // The data can be periodic iff the extent is the same as the grid.
                    if (header.grid.some(function (v, i) { return v !== header.extent[i]; }))
                        isPeriodic = false;
                    _a = {};
                    return [4 /*yield*/, File.createFile(filename)];
                case 1:
                    ctx = (_a.file = _e.sent(),
                        _a.isPeriodic = isPeriodic,
                        _a.channels = channels,
                        _a.valueType = valueType,
                        _a.blockSize = blockSize,
                        _a.cubeBuffer = cubeBuffer,
                        _a.litteEndianCubeBuffer = litteEndianCubeBuffer,
                        _a.sampling = rates.map(function (r) { return createSampling(valueType, channels.length, header.extent, blockSize, r); }),
                        _a.lerpCube = createLerpCube(header.extent),
                        _a.kSampling = [],
                        _a.dataByteOffset = 0,
                        _a.totalByteSize = 0,
                        _a.progress = { current: 0, max: 0 },
                        _a);
                    // Create kSampling index.
                    ctx.kSampling.push([]);
                    ctx.kSampling.push([ctx.sampling[0]]);
                    addedSamplings = new Set();
                    for (k = 2; k < rates[rates.length - 1]; k++) {
                        current = [];
                        ctx.kSampling.push(current);
                        for (_i = 0, _b = ctx.sampling; _i < _b.length; _i++) {
                            s = _b[_i];
                            if (addedSamplings.has(s.rate) || s.rate % k !== 0)
                                continue;
                            addedSamplings.add(s.rate);
                            current.push(s);
                        }
                    }
                    byteOffset = 0;
                    for (_c = 0, _d = ctx.sampling; _c < _d.length; _c++) {
                        s = _d[_c];
                        // Max progress = total number of blocks that need to be written.
                        ctx.progress.max += Data.samplingBlockCount(s, blockSize);
                        s.byteOffset = byteOffset;
                        byteOffset += s.byteSize;
                    }
                    ctx.dataByteOffset = 4 + DataFormat.encodeHeader(Data.createHeader(ctx)).byteLength;
                    ctx.totalByteSize = ctx.dataByteOffset + byteOffset;
                    return [2 /*return*/, ctx];
            }
        });
    });
}
exports.createContext = createContext;
function processLayer(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var kSampling, k;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    kSampling = ctx.kSampling;
                    advanceSampling1(kSampling[1][0], ctx);
                    for (k = 2; k < kSampling.length; k++) {
                        if (!kSampling[k].length)
                            continue;
                        advanceSamplingK(k, kSampling[k], ctx);
                    }
                    return [4 /*yield*/, writeCubeLayers(ctx)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.processLayer = processLayer;
/** Advances sampling rate 1 */
function advanceSampling1(sampling, ctx) {
    var channels = ctx.channels;
    var blocksLayer = sampling.blocksLayer;
    var size = blocksLayer.dimensions[0] * blocksLayer.dimensions[1] * channels[0].layer.readHeight;
    var targetOffset = blocksLayer.slicesWritten * blocksLayer.dimensions[0] * blocksLayer.dimensions[1];
    for (var i = 0; i < channels.length; i++) {
        var layer = channels[i].layer;
        var target = blocksLayer.values[i];
        var values = layer.values, valuesOffset = layer.valuesOffset;
        for (var o = 0; o < size; o++) {
            target[targetOffset + o] = values[valuesOffset + o];
        }
    }
    blocksLayer.isFull = (channels[0].layer.readCount % 2) === 0 || channels[0].layer.isFinished;
    blocksLayer.slicesWritten += channels[0].layer.readHeight;
    blocksLayer.lastProcessedSlice = channels[0].layer.endSlice;
}
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
/** Divides each value by rate^3 */
function averageSampling(sampling) {
    if (sampling.rate === 1)
        return;
    var factor = 1 / (sampling.rate * sampling.rate * sampling.rate);
    for (var _i = 0, _a = sampling.blocksLayer.values; _i < _a.length; _i++) {
        var buffer = _a[_i];
        for (var i = 0, _ii = buffer.length; i < _ii; i++) {
            buffer[i] = factor * buffer[i];
        }
    }
}
/** Fill a cube at position (u,v) with values from each of the channel */
function fillCubeBuffer(ctx, sampling, u, v) {
    var blockSize = ctx.blockSize, cubeBuffer = ctx.cubeBuffer;
    var _a = sampling.blocksLayer, dimensions = _a.dimensions, buffers = _a.buffers, slicesWritten = _a.slicesWritten;
    var elementSize = DataFormat.getValueByteSize(ctx.valueType);
    var sizeH = dimensions[0], sizeHK = dimensions[0] * dimensions[1];
    var offsetH = u * blockSize, offsetK = v * blockSize;
    var copyH = Math.min(blockSize, dimensions[0] - offsetH) * elementSize, maxK = offsetK + Math.min(blockSize, dimensions[1] - offsetK), maxL = slicesWritten;
    var writeOffset = 0;
    for (var _i = 0, buffers_1 = buffers; _i < buffers_1.length; _i++) {
        var src = buffers_1[_i];
        for (var l = 0; l < maxL; l++) {
            for (var k = offsetK; k < maxK; k++) {
                var start = (l * sizeHK + k * sizeH + offsetH) * elementSize;
                src.copy(cubeBuffer, writeOffset, start, start + copyH);
                writeOffset += copyH;
            }
        }
    }
    File.ensureLittleEndian(ctx.cubeBuffer, ctx.litteEndianCubeBuffer, writeOffset, elementSize, 0);
    return writeOffset;
}
/** Converts a layer to blocks and writes them to the output file. */
function writeSamplingLayer(ctx, sampling) {
    return __awaiter(this, void 0, void 0, function () {
        var nU, nV, startOffset, v, u, size;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    averageSampling(sampling);
                    nU = Math.ceil(sampling.blocksLayer.dimensions[0] / ctx.blockSize);
                    nV = Math.ceil(sampling.blocksLayer.dimensions[1] / ctx.blockSize);
                    startOffset = ctx.dataByteOffset + sampling.byteOffset;
                    v = 0;
                    _a.label = 1;
                case 1:
                    if (!(v < nV)) return [3 /*break*/, 6];
                    u = 0;
                    _a.label = 2;
                case 2:
                    if (!(u < nU)) return [3 /*break*/, 5];
                    size = fillCubeBuffer(ctx, sampling, u, v);
                    return [4 /*yield*/, File.writeBuffer(ctx.file, startOffset + sampling.writeByteOffset, ctx.litteEndianCubeBuffer, size)];
                case 3:
                    _a.sent();
                    sampling.writeByteOffset += size;
                    updateProgress(ctx.progress, 1);
                    _a.label = 4;
                case 4:
                    u++;
                    return [3 /*break*/, 2];
                case 5:
                    v++;
                    return [3 /*break*/, 1];
                case 6:
                    sampling.blocksLayer.isFull = false;
                    sampling.blocksLayer.slicesWritten = 0;
                    return [2 /*return*/];
            }
        });
    });
}
/** Writes all full buffers */
function writeCubeLayers(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, s;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _i = 0, _a = ctx.sampling;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    s = _a[_i];
                    if (!s.blocksLayer.isFull)
                        return [3 /*break*/, 3];
                    return [4 /*yield*/, writeSamplingLayer(ctx, s)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function updateProgress(progress, progressDone) {
    var old = (100 * progress.current / progress.max).toFixed(0);
    progress.current += progressDone;
    var $new = (100 * progress.current / progress.max).toFixed(0);
    if (old !== $new) {
        process.stdout.write("\rWriting data...    " + $new + "%");
    }
}
