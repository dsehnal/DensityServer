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
function createLayerContext(header, blockSize) {
    var extent = header.extent;
    var size = 2 * blockSize * extent[0] * extent[1];
    var buffer = File.createTypedArrayBufferContext(size, header.mode === 2 /* Float32 */ ? 0 /* Float32 */ : 1 /* Int8 */);
    return {
        buffer: buffer,
        blockSize: blockSize,
        startSlice: 0,
        endSlice: 0,
        values: buffer.values,
        valuesOffset: 0,
        readCount: 0,
        readHeight: 0,
        isFinished: false
    };
}
function compareProp(a, b) {
    if (a instanceof Array && b instanceof Array) {
        if (a.length !== b.length)
            return false;
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    return a === b;
}
function compareHeaders(a, b) {
    for (var _i = 0, _a = ['grid', 'axisOrder', 'extent', 'origin', 'spacegroupNumber', 'cellSize', 'cellAngles', 'mode']; _i < _a.length; _i++) {
        var p = _a[_i];
        if (!compareProp(a[p], b[p]))
            return false;
    }
    return true;
}
exports.compareHeaders = compareHeaders;
function getArray(r, offset, count) {
    var ret = [];
    for (var i = 0; i < count; i++) {
        ret[i] = r(offset + i);
    }
    return ret;
}
function readHeader(name, file) {
    return __awaiter(this, void 0, void 0, function () {
        var headerSize, _a, bytesRead, data, littleEndian, mode, readInt, readFloat, origin2k, nxyzStart, header;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    headerSize = 1024;
                    return [4 /*yield*/, File.readBuffer(file, 0, headerSize)];
                case 1:
                    _a = _b.sent(), bytesRead = _a.bytesRead, data = _a.buffer;
                    littleEndian = true;
                    mode = data.readInt32LE(3 * 4);
                    if (mode !== 0 && mode !== 2) {
                        littleEndian = false;
                        mode = data.readInt32BE(3 * 4, true);
                        if (mode !== 0 && mode !== 2) {
                            throw Error('Only CCP4 modes 0 and 2 are supported.');
                        }
                    }
                    readInt = littleEndian ? function (o) { return data.readInt32LE(o * 4); } : function (o) { return data.readInt32BE(o * 4); };
                    readFloat = littleEndian ? function (o) { return data.readFloatLE(o * 4); } : function (o) { return data.readFloatBE(o * 4); };
                    origin2k = getArray(readFloat, 49, 3);
                    nxyzStart = getArray(readInt, 4, 3);
                    header = {
                        name: name,
                        mode: mode,
                        grid: getArray(readInt, 7, 3),
                        axisOrder: getArray(readInt, 16, 3).map(function (i) { return i - 1; }),
                        extent: getArray(readInt, 0, 3),
                        origin: origin2k[0] === 0.0 && origin2k[1] === 0.0 && origin2k[2] === 0.0 ? nxyzStart : origin2k,
                        spacegroupNumber: readInt(22),
                        cellSize: getArray(readFloat, 10, 3),
                        cellAngles: getArray(readFloat, 13, 3),
                        mean: readFloat(21),
                        sigma: 0.0,
                        min: Number.POSITIVE_INFINITY,
                        max: Number.NEGATIVE_INFINITY,
                        littleEndian: littleEndian,
                        dataOffset: headerSize + readInt(23) /* symBytes */
                    };
                    return [2 /*return*/, header];
            }
        });
    });
}
function readLayer(data, sliceIndex) {
    return __awaiter(this, void 0, void 0, function () {
        function updateSigma() {
            var sigma = header.sigma;
            var min = header.min;
            var max = header.max;
            for (var i = valuesOffset, _ii = valuesOffset + sliceCount; i < _ii; i++) {
                var v = values[i];
                var t = mean - v;
                sigma += t * t;
                if (v < min)
                    min = v;
                else if (v > max)
                    max = v;
            }
            header.sigma = sigma;
            header.min = min;
            header.max = max;
        }
        var layer, header, extent, mean, sliceSize, sliceOffsetIndex, sliceByteOffset, sliceHeight, sliceCount, valuesOffset, values;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (sliceIndex >= data.numSlices) {
                        data.layer.isFinished = true;
                        return [2 /*return*/, 0];
                    }
                    layer = data.layer;
                    header = data.header;
                    extent = header.extent, mean = header.mean;
                    sliceSize = extent[0] * extent[1];
                    sliceOffsetIndex = sliceIndex * layer.blockSize;
                    sliceByteOffset = layer.buffer.elementByteSize * sliceSize * sliceOffsetIndex;
                    sliceHeight = Math.min(layer.blockSize, extent[2] - sliceOffsetIndex);
                    sliceCount = sliceHeight * sliceSize;
                    valuesOffset = (layer.readCount % 2) * layer.blockSize * sliceSize;
                    return [4 /*yield*/, File.readTypedArray(layer.buffer, data.file, header.dataOffset + sliceByteOffset, sliceCount, valuesOffset, header.littleEndian)];
                case 1:
                    values = _a.sent();
                    updateSigma();
                    layer.readCount++;
                    if (layer.readCount > 2)
                        layer.startSlice += layer.blockSize;
                    layer.endSlice += sliceHeight;
                    layer.readHeight = sliceHeight;
                    layer.valuesOffset = valuesOffset;
                    if (sliceIndex >= data.numSlices - 1) {
                        header.sigma = Math.sqrt(header.sigma / (extent[0] * extent[1] * extent[2]));
                        layer.isFinished = true;
                    }
                    return [2 /*return*/, sliceHeight];
            }
        });
    });
}
exports.readLayer = readLayer;
function open(name, filename, blockSize) {
    return __awaiter(this, void 0, void 0, function () {
        var file, header;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, File.openRead(filename)];
                case 1:
                    file = _a.sent();
                    return [4 /*yield*/, readHeader(name, file)];
                case 2:
                    header = _a.sent();
                    return [2 /*return*/, {
                            header: header,
                            file: file,
                            layer: createLayerContext(header, blockSize),
                            numSlices: Math.ceil(header.extent[2] / blockSize) | 0
                        }];
            }
        });
    });
}
exports.open = open;
