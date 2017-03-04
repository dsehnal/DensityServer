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
var DataFormat = require("../../Common/DataFormat");
var Box = require("../Algebra/Box");
var Coords = require("../Algebra/Coordinate");
var File = require("../../Common/File");
function readBlock(query, coord, blockBox) {
    return __awaiter(this, void 0, void 0, function () {
        var sampleCount, size, _a, valueType, blockSize, buffer, byteOffset, values;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    sampleCount = Box.dimensions(Box.fractionalToGrid(blockBox, query.sampling.dataDomain));
                    size = query.data.header.channels.length * sampleCount[0] * sampleCount[1] * sampleCount[2];
                    _a = query.data.header, valueType = _a.valueType, blockSize = _a.blockSize;
                    buffer = File.createTypedArrayBufferContext(size, valueType);
                    byteOffset = query.sampling.byteOffset
                        + DataFormat.getValueByteSize(valueType) * (coord[0] + coord[1] * blockSize + coord[2] * blockSize * blockSize);
                    return [4 /*yield*/, File.readTypedArray(buffer, query.data.file, byteOffset, size, 0)];
                case 1:
                    values = _b.sent();
                    return [2 /*return*/, {
                            sampleCount: sampleCount,
                            values: values
                        }];
            }
        });
    });
}
exports.readBlock = readBlock;
function fillData(query, blockData, blockGridBox, queryGridBox) {
    var source = blockData.values, blockSampleCount = blockData.sampleCount;
    var tSizeH = query.gridDomain.sampleCount[0], tSizeHK = query.gridDomain.sampleCount[0] * query.gridDomain.sampleCount[1];
    var sSizeH = blockSampleCount[0], sSizeHK = blockSampleCount[0] * blockSampleCount[1];
    var offsetTarget = queryGridBox.a[0] + queryGridBox.a[1] * tSizeH + queryGridBox.a[2] * tSizeHK;
    var _a = Box.dimensions(blockGridBox), maxH = _a[0], maxK = _a[1], maxL = _a[2];
    for (var channelIndex = 0, _ii = query.data.header.channels.length; channelIndex < _ii; channelIndex++) {
        var target = query.result.values[channelIndex];
        var offsetSource = channelIndex * blockGridBox.a.domain.sampleVolume
            + blockGridBox.a[0] + blockGridBox.a[1] * sSizeH + blockGridBox.a[2] * sSizeHK;
        for (var l = 0; l <= maxL; l++) {
            for (var k = 0; k <= maxK; k++) {
                for (var h = 0; h <= maxH; h++) {
                    target[offsetTarget + h + k * tSizeH + l * tSizeHK] = source[offsetSource + h + k * sSizeH + l * sSizeHK];
                }
            }
        }
    }
}
function createBlockGridDomain(block, grid, blockSize) {
    var blockBox = Box.fractionalFromBlock(block);
    var origin = blockBox.a;
    var dimensions = Coords.sub(blockBox.b, blockBox.a);
    var sampleCount = Coords.sampleCounts(dimensions, grid.delta, 'ceil');
    return Coords.domain('BlockGrid', { origin: origin, dimensions: dimensions, delta: grid.delta, sampleCount: sampleCount });
}
/** Read the block data and fill all the overlaps with the query region. */
function fillBlock(query, block) {
    return __awaiter(this, void 0, void 0, function () {
        var baseBox, blockGridDomain, blockData, _i, _a, offset, offsetBlockBox, dataBox, blockGridBox, queryGridBox;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    baseBox = Box.fractionalFromBlock(block.coord);
                    blockGridDomain = createBlockGridDomain(block.coord, query.sampling.dataDomain, query.data.header.blockSize);
                    return [4 /*yield*/, readBlock(query, block.coord, baseBox)];
                case 1:
                    blockData = _b.sent();
                    for (_i = 0, _a = block.offsets; _i < _a.length; _i++) {
                        offset = _a[_i];
                        offsetBlockBox = Box.shift(baseBox, offset);
                        dataBox = Box.intersect(offsetBlockBox, query.fractionalBox);
                        if (!dataBox)
                            continue;
                        blockGridBox = Box.clampGridToSamples(Box.fractionalRoundToGrid(dataBox, blockGridDomain));
                        queryGridBox = Box.clampGridToSamples(Box.fractionalRoundToGrid(dataBox, query.gridDomain));
                        fillData(query, blockData, blockGridBox, queryGridBox);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function compose(query, blocks) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, blocks_1, block;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, blocks_1 = blocks;
                    _a.label = 1;
                case 1:
                    if (!(_i < blocks_1.length)) return [3 /*break*/, 4];
                    block = blocks_1[_i];
                    return [4 /*yield*/, fillBlock(query, block)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.default = compose;
