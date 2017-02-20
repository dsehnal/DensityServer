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
var BlockWriter = require("./BlockWriter");
function processSlice(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var v, u, _i, _a, src, numBytes;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    v = 0;
                    _b.label = 1;
                case 1:
                    if (!(v < ctx.blockCounts[0])) return [3 /*break*/, 8];
                    u = 0;
                    _b.label = 2;
                case 2:
                    if (!(u < ctx.blockCounts[1])) return [3 /*break*/, 7];
                    _i = 0, _a = ctx.sources;
                    _b.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    src = _a[_i];
                    numBytes = BlockWriter.fillCube(ctx, src.slice.data.values, u, v, src.slice.height);
                    return [4 /*yield*/, File.write(ctx.file, ctx.cubeBuffer, numBytes)];
                case 4:
                    _b.sent();
                    BlockWriter.updateProgress(ctx.progress, 1);
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    u++;
                    return [3 /*break*/, 2];
                case 7:
                    v++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.processSlice = processSlice;
function createContext(filename, progress, sources, blockSize) {
    return __awaiter(this, void 0, void 0, function () {
        var sampleCounts, blockCounts, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    sampleCounts = sources[0].header.extent;
                    blockCounts = [Math.ceil(sampleCounts[0] / blockSize) | 0, Math.ceil(sampleCounts[1] / blockSize) | 0, Math.ceil(sampleCounts[2] / blockSize) | 0];
                    progress.max += blockCounts[0] * blockCounts[1] * blockCounts[2] * sources.length;
                    _a = {};
                    return [4 /*yield*/, File.createFile(filename)];
                case 1: return [2 /*return*/, (_a.file = _b.sent(),
                        _a.sigmasOffset = 0,
                        _a.sources = sources,
                        _a.progress = progress,
                        _a.blockSize = blockSize,
                        _a.sampleCounts = sampleCounts,
                        _a.blockCounts = [Math.ceil(sampleCounts[0] / blockSize) | 0, Math.ceil(sampleCounts[1] / blockSize) | 0, Math.ceil(sampleCounts[2] / blockSize) | 0],
                        _a.cubeBuffer = new Buffer(new ArrayBuffer(sources[0].slice.data.elementByteSize * blockSize * blockSize * blockSize)),
                        _a)];
            }
        });
    });
}
exports.createContext = createContext;
