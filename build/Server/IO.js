/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var Data = require("./DataModel");
var Transforms_1 = require("./Transforms");
function getArray(r, offset, count, step) {
    if (step === void 0) { step = 1; }
    var ret = [];
    for (var i = 0; i < count; i++) {
        ret[i] = r(offset + i * step);
    }
    return ret;
}
function readHeader(file) {
    return __awaiter(this, void 0, void 0, function () {
        var maxDensityCount, headerBaseSize, readSize, data, littleEndian, numDensities, readInt, readFloat, readString, header;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    maxDensityCount = 4;
                    headerBaseSize = 23 * 4;
                    readSize = headerBaseSize + 4 * 4 * maxDensityCount + 32 * maxDensityCount;
                    return [4 /*yield*/, File.readBuffer(file, 0, readSize)];
                case 1:
                    data = (_a.sent()).buffer;
                    littleEndian = data.readInt32LE(0) === 0x1237;
                    numDensities = littleEndian ? data.readInt32LE(4) : data.readUInt32BE(4);
                    if (numDensities > maxDensityCount) {
                        throw Error('At most 4 density fields are supported per single file.');
                    }
                    readInt = littleEndian ? function (o) { return data.readInt32LE(8 + o * 4); } : function (o) { return data.readInt32BE(8 + o * 4); };
                    readFloat = littleEndian ? function (o) { return data.readFloatLE(8 + o * 4); } : function (o) { return data.readFloatBE(8 + o * 4); };
                    readString = function (o) {
                        var bytes = [];
                        for (var i = 0; i < 32; i++)
                            bytes.push(data.readUInt8(8 + 4 * o + i));
                        return String.fromCharCode.apply(null, bytes).trim();
                    };
                    header = {
                        numDensities: numDensities,
                        formatId: readInt(0),
                        gridSize: getArray(readInt, 1, 3),
                        blockSize: readInt(4),
                        axisOrder: getArray(readInt, 5, 3),
                        extent: getArray(readInt, 8, 3),
                        origin: getArray(readFloat, 11, 3),
                        spacegroupNumber: readInt(14),
                        cellSize: getArray(readFloat, 15, 3),
                        cellAngles: getArray(readFloat, 18, 3),
                        means: getArray(readFloat, 21, numDensities),
                        sigmas: getArray(readFloat, 21 + numDensities, numDensities),
                        minimums: getArray(readFloat, 21 + 2 * numDensities, numDensities),
                        maximums: getArray(readFloat, 21 + 3 * numDensities, numDensities),
                        names: getArray(readString, 21 + 4 * numDensities, numDensities, 8),
                        dataByteOffset: headerBaseSize + 4 * 4 * numDensities + 32 * numDensities
                    };
                    return [2 /*return*/, header];
            }
        });
    });
}
exports.readHeader = readHeader;
function createInfo(header) {
    var blockSize = header.blockSize, extent = header.extent, gridSize = header.gridSize, origin = header.origin;
    var spacegroup = Transforms_1.Coords.makeSpacegroup(header);
    var grid = Transforms_1.Coords.mapIndices(header.axisOrder, gridSize);
    var a = Transforms_1.Coords.map(function (v) { return Math.round(v); }, Transforms_1.Coords.mapIndices(header.axisOrder, Transforms_1.Coords.transform(origin, spacegroup.toFrac)));
    return __assign({ isAsymmetric: header.spacegroupNumber <= 0, blockCount: Transforms_1.Coords.map(function (e) { return Math.ceil(e / blockSize) | 0; }, extent) }, spacegroup, { grid: grid, dataBox: Transforms_1.Box.normalize({
            a: a,
            b: Transforms_1.Coords.add(a, extent)
        }) });
}
function open(filename) {
    return __awaiter(this, void 0, void 0, function () {
        var file, header, info, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, File.openRead(filename)];
                case 1:
                    file = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, readHeader(file)];
                case 3:
                    header = _a.sent();
                    info = createInfo(header);
                    return [2 /*return*/, { file: file, header: header, info: info }];
                case 4:
                    e_1 = _a.sent();
                    File.close(file);
                    throw e_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.open = open;
function readBlock(ctx, coord) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, box, dimensions, dataOffset, count, data, values;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = Transforms_1.Box.getBlockMetrics(ctx, coord), box = _a.box, dimensions = _a.dimensions, dataOffset = _a.dataOffset;
                    count = dimensions[0] * dimensions[1] * dimensions[2];
                    data = File.createTypedArrayBufferContext(ctx.header.numDensities * count, ctx.header.formatId === 0 /* Float32 */ ? 0 /* Float32 */ : 1 /* Int8 */);
                    return [4 /*yield*/, File.readTypedArray(data, ctx.file, dataOffset, ctx.header.numDensities * count)];
                case 1:
                    values = _b.sent();
                    return [2 /*return*/, {
                            coord: coord,
                            dimensions: dimensions,
                            box: box,
                            values: values,
                            blockCount: ctx.info.blockCount
                        }];
            }
        });
    });
}
exports.readBlock = readBlock;
