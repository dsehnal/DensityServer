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
var CCP4 = require("./CCP4");
var File = require("../Utils/File");
var Writer = require("./Writer");
var Convert = require("./Convert");
var Downsample = require("./Downsample");
var path = require("path");
var fs = require("fs");
function getTime() {
    var t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}
function getDownsampleRates(src, blockSize) {
    return [2, 4];
}
function createContexts(folder, sources, blockSize, downsample) {
    return __awaiter(this, void 0, void 0, function () {
        var src, progress, convert, rates, downsamples, _i, rates_1, r, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    src = sources[0];
                    progress = { current: 0, max: 0 };
                    return [4 /*yield*/, Convert.createContext(path.join(folder, '1.mdb'), progress, sources, blockSize)];
                case 1:
                    convert = _d.sent();
                    if (!downsample)
                        return [2 /*return*/, { convert: convert, downsamples: [] }];
                    rates = getDownsampleRates(src.header, blockSize);
                    downsamples = [];
                    _i = 0, rates_1 = rates;
                    _d.label = 2;
                case 2:
                    if (!(_i < rates_1.length)) return [3 /*break*/, 5];
                    r = rates_1[_i];
                    _b = (_a = downsamples).push;
                    return [4 /*yield*/, Downsample.createContext(path.join(folder, r + ".mdb"), progress, sources, blockSize, r)];
                case 3:
                    _b.apply(_a, [_d.sent()]);
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { convert: convert, downsamples: downsamples }];
            }
        });
    });
}
function processBlocks(_a) {
    var convert = _a.convert, downsamples = _a.downsamples;
    return __awaiter(this, void 0, void 0, function () {
        var numSlices, i, _i, _a, src, _b, downsamples_1, sample;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    numSlices = convert.sources[0].numSlices;
                    i = 0;
                    _c.label = 1;
                case 1:
                    if (!(i < numSlices)) return [3 /*break*/, 11];
                    _i = 0, _a = convert.sources;
                    _c.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    src = _a[_i];
                    return [4 /*yield*/, CCP4.readLayer(src, i)];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, Convert.processLayer(convert)];
                case 6:
                    _c.sent();
                    _b = 0, downsamples_1 = downsamples;
                    _c.label = 7;
                case 7:
                    if (!(_b < downsamples_1.length)) return [3 /*break*/, 10];
                    sample = downsamples_1[_b];
                    return [4 /*yield*/, Downsample.processLayer(sample)];
                case 8:
                    _c.sent();
                    _c.label = 9;
                case 9:
                    _b++;
                    return [3 /*break*/, 7];
                case 10:
                    i++;
                    return [3 /*break*/, 1];
                case 11: return [2 /*return*/];
            }
        });
    });
}
function createJsonInfo(filename, contexts) {
    return __awaiter(this, void 0, void 0, function () {
        var header;
        return __generator(this, function (_a) {
            header = __assign({}, contexts.convert.blockHeader);
            delete header.dataByteOffset;
            header.samplingRates = [1].concat(contexts.downsamples.map(function (s) { return s.sampleRate; }));
            return [2 /*return*/, new Promise(function (res, rej) {
                    var json = JSON.stringify(header, null, 2);
                    fs.writeFile(filename, json, function (err) {
                        if (err)
                            rej(err);
                        else
                            res();
                    });
                })];
        });
    });
}
function create(folder, sourceDensities, blockSize, downsample) {
    if (downsample === void 0) { downsample = false; }
    return __awaiter(this, void 0, void 0, function () {
        var startedTime, files, sources_1, _i, sourceDensities_1, s, _a, _b, _c, isOk, contexts, all, _d, sources_2, s, _e, all_1, ctx, _f, all_2, ctx, _g, _h, all_3, ctx, time, _j, files_1, f;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    startedTime = getTime();
                    if (!sourceDensities.length) {
                        throw Error('Specify at least one source density.');
                    }
                    console.log("Block Size: " + blockSize + ".");
                    process.stdout.write('Initializing... ');
                    files = [];
                    _k.label = 1;
                case 1:
                    _k.trys.push([1, , 17, 18]);
                    sources_1 = [];
                    _i = 0, sourceDensities_1 = sourceDensities;
                    _k.label = 2;
                case 2:
                    if (!(_i < sourceDensities_1.length)) return [3 /*break*/, 5];
                    s = sourceDensities_1[_i];
                    _b = (_a = sources_1).push;
                    return [4 /*yield*/, CCP4.open(s.name, s.filename, blockSize)];
                case 3:
                    _b.apply(_a, [_k.sent()]);
                    _k.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    isOk = sources_1.reduce(function (ok, s) { return ok && CCP4.compareHeaders(sources_1[0].header, s.header); }, true);
                    if (!isOk) {
                        throw new Error('Input file headers are not compatible (different grid, etc.).');
                    }
                    return [4 /*yield*/, createContexts(folder, sources_1, blockSize, downsample)];
                case 6:
                    contexts = _k.sent();
                    all = [contexts.convert].concat(contexts.downsamples);
                    for (_d = 0, sources_2 = sources_1; _d < sources_2.length; _d++) {
                        s = sources_2[_d];
                        files.push(s.file);
                    }
                    for (_e = 0, all_1 = all; _e < all_1.length; _e++) {
                        ctx = all_1[_e];
                        files.push(ctx.file.file);
                    }
                    process.stdout.write('   done.\n');
                    process.stdout.write('Writing header... ');
                    _f = 0, all_2 = all;
                    _k.label = 7;
                case 7:
                    if (!(_f < all_2.length)) return [3 /*break*/, 10];
                    ctx = all_2[_f];
                    _g = ctx;
                    return [4 /*yield*/, Writer.writeHeader(ctx)];
                case 8:
                    _g.blockHeader = _k.sent();
                    _k.label = 9;
                case 9:
                    _f++;
                    return [3 /*break*/, 7];
                case 10:
                    process.stdout.write(' done.\n');
                    process.stdout.write('Writing data...    0%');
                    return [4 /*yield*/, processBlocks(contexts)];
                case 11:
                    _k.sent();
                    process.stdout.write('\rWriting data...    done.\n');
                    process.stdout.write('Updating info...   ');
                    _h = 0, all_3 = all;
                    _k.label = 12;
                case 12:
                    if (!(_h < all_3.length)) return [3 /*break*/, 15];
                    ctx = all_3[_h];
                    return [4 /*yield*/, Writer.writeInfo(ctx)];
                case 13:
                    _k.sent();
                    _k.label = 14;
                case 14:
                    _h++;
                    return [3 /*break*/, 12];
                case 15: return [4 /*yield*/, createJsonInfo(path.join(folder, 'info.json'), contexts)];
                case 16:
                    _k.sent();
                    process.stdout.write('done.\n');
                    time = getTime() - startedTime;
                    console.log("[Done] " + time.toFixed(0) + "ms.");
                    return [3 /*break*/, 18];
                case 17:
                    for (_j = 0, files_1 = files; _j < files_1.length; _j++) {
                        f = files_1[_j];
                        File.close(f);
                    }
                    return [7 /*endfinally*/];
                case 18: return [2 /*return*/];
            }
        });
    });
}
function pack(input, blockSize, outputFilename) {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, create(outputFilename, input, blockSize)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    console.error('[Error] ' + e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pack;
