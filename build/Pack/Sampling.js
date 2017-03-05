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
var Downsampling = require("./Downsampling");
var Writer = require("./Writer");
var DataFormat = require("../Common/DataFormat");
function getSamplingRates(baseSampleCount, blockSize) {
    var ret = [1];
    // TODO
    var allowedDivisors = [2, 3, 5];
    var maxDiv = Math.min(2 * Math.ceil(baseSampleCount.reduce(function (m, v) { return Math.min(m, v); }, baseSampleCount[0]) / blockSize), blockSize / 2);
    var _loop_1 = function (i) {
        // we do not want "large"" prime divisors such as 13 or 17.
        if (allowedDivisors.some(function (d) { return (i % d) === 0; })) {
            ret.push(i);
        }
    };
    for (var i = 2; i <= maxDiv; i++) {
        _loop_1(i);
    }
    return ret;
}
function createBlocksLayer(sampleCount, blockSize, valueType, numChannels) {
    var values = [];
    for (var i = 0; i < numChannels; i++)
        values[i] = DataFormat.createValueArray(valueType, sampleCount[0] * sampleCount[1] * blockSize);
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
                    litteEndianCubeBuffer = File.IsNativeEndianLittle
                        ? cubeBuffer
                        : new Buffer(new ArrayBuffer(channels.length * blockSize * blockSize * blockSize * DataFormat.getValueByteSize(valueType)));
                    // The data can be periodic iff the extent is the same as the grid and origin is 0.
                    if (header.grid.some(function (v, i) { return v !== header.extent[i]; }) || header.origin.some(function (v) { return v !== 0; })) {
                        isPeriodic = false;
                    }
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
                        Downsampling.advanceSamplingK(k, kSampling[k], ctx);
                    }
                    return [4 /*yield*/, Writer.writeCubeLayers(ctx)];
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
