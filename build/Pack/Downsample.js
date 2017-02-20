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
function getSampleCounts(extent, sampleRate) {
    return [Math.ceil(extent[0] / sampleRate), Math.ceil(extent[1] / sampleRate), Math.ceil(extent[2] / sampleRate)];
}
function createContext(filename, progress, sources, blockSize, sampleRate) {
    return __awaiter(this, void 0, void 0, function () {
        var extent, sampleCounts, downsampleSliceSize, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    extent = sources[0].header.extent;
                    sampleCounts = [Math.ceil(extent[0] / sampleRate), Math.ceil(extent[1] / sampleRate), Math.ceil(extent[2] / sampleRate)];
                    downsampleSliceSize = sampleCounts[0] * sampleCounts[1] * blockSize;
                    _a = {};
                    return [4 /*yield*/, File.createFile(filename)];
                case 1: 
                // 2 * Math.ceil(sampleRate * sampleCounts[0] / extent[0])
                return [2 /*return*/, (_a.file = _b.sent(),
                        _a.sources = sources,
                        _a.sampleCounts = sampleCounts,
                        _a.blockSize = blockSize,
                        _a.sigmasOffset = 0,
                        _a.progress = { current: 0, max: 0 },
                        _a.downsampledSlices = sources.map(function (_) { return new Float32Array(downsampleSliceSize); }),
                        _a.sampleRate = sampleRate,
                        _a.currentSlice = 0,
                        _a.endSlice = 0,
                        _a)];
            }
        });
    });
}
exports.createContext = createContext;
function downsampleSlice(ctx, index) {
    //const { sliceHeight } = ctx.sources[index].slice;
    var numSlices = ctx.currentSlice;
    return numSlices;
}
function nextSlice(ctx) {
    ctx.endSlice += ctx.sources[0].slice.blockSize;
}
exports.nextSlice = nextSlice;
function processSlice(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    });
}
exports.processSlice = processSlice;
