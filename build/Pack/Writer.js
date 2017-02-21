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
var CCP4 = require("./CCP4");
var File = require("../Utils/File");
var BlockFormat = require("../Common/BlockFormat");
var FORMAT_VERSION = 1;
function createCubeContext(params) {
    return {
        buffer: new Buffer(new ArrayBuffer(params.elementByteSize * params.blockSize * params.blockSize * params.blockSize)),
        size: params.blockSize,
        extent: params.extent,
        numU: Math.ceil(params.extent[0] / params.blockSize) | 0,
        numV: Math.ceil(params.extent[1] / params.blockSize) | 0
    };
}
exports.createCubeContext = createCubeContext;
function fillCube(ctx, values, valuesOffset, u, v, height) {
    var oH = ctx.blockSize * u;
    var oK = ctx.blockSize * v;
    var sizeH = ctx.samples[0];
    var sizeHK = ctx.samples[0] * ctx.samples[1];
    var cH = Math.min(ctx.blockSize, ctx.samples[0] - oH);
    var cK = Math.min(ctx.blockSize, ctx.samples[1] - oK);
    var cL = height;
    var elementByteSize = ctx.sources[0].layer.buffer.elementByteSize;
    var isFloat = ctx.sources[0].layer.buffer.type === 0 /* Float32 */;
    var buffer = ctx.cubeBuffer;
    var offset = 0;
    for (var l = 0; l < cL; l++) {
        for (var k = 0; k < cK; k++) {
            for (var h = 0; h < cH; h++) {
                var t = values[valuesOffset + oH + h + (k + oK) * sizeH + l * sizeHK];
                if (isFloat)
                    buffer.writeFloatLE(t, offset, true);
                else
                    buffer.writeInt8(t, offset, true);
                offset += elementByteSize;
            }
        }
    }
    return offset;
}
exports.fillCube = fillCube;
function makeHeader(ctx) {
    var header = ctx.sources[0].header;
    var headers = ctx.sources.map(function (d) { return d.header; });
    var grid = header.grid;
    function normalize(data) {
        return [data[0] / grid[0], data[1] / grid[1], data[2] / grid[2]];
    }
    return {
        version: FORMAT_VERSION,
        numDensities: ctx.sources.length,
        formatId: header.mode == 2 /* Float32 */ ? 0 /* Float32 */ : 2 /* Int8 */,
        blockSize: ctx.blockSize,
        axisOrder: header.axisOrder,
        samples: ctx.samples,
        dimensions: normalize(header.extent),
        origin: normalize(header.origin),
        spacegroupNumber: header.spacegroupNumber,
        cellSize: header.cellSize,
        cellAngles: header.cellAngles,
        means: headers.map(function (h) { return h.mean; }),
        sigmas: headers.map(function (h) { return h.sigma; }),
        minimums: headers.map(function (h) { return h.min; }),
        maximums: headers.map(function (h) { return h.max; }),
        names: headers.map(function (h) { return h.name; }),
        dataByteOffset: 0
    };
}
function writeHeader(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var header, _i, _a, v, _b, _c, v, _d, _e, v, _f, _g, v, _h, _j, v, _k, _l, v, _m, _o, v, _p, _q, v, _r, _s, v, _t, _u, v, _v, _w, n;
        return __generator(this, function (_x) {
            switch (_x.label) {
                case 0:
                    header = makeHeader(ctx);
                    // 0:1   Format Version
                    return [4 /*yield*/, File.writeInt(ctx.file, FORMAT_VERSION)];
                case 1:
                    // 0:1   Format Version
                    _x.sent();
                    // 1:1   N = Num densities
                    return [4 /*yield*/, File.writeInt(ctx.file, header.numDensities)];
                case 2:
                    // 1:1   N = Num densities
                    _x.sent();
                    // 2:1   Format ID (0 = float32 values, 1 = int8 values)
                    return [4 /*yield*/, File.writeInt(ctx.file, header.formatId)];
                case 3:
                    // 2:1   Format ID (0 = float32 values, 1 = int8 values)
                    _x.sent();
                    // 3:1   Block size
                    return [4 /*yield*/, File.writeInt(ctx.file, ctx.blockSize)];
                case 4:
                    // 3:1   Block size
                    _x.sent();
                    _i = 0, _a = header.axisOrder;
                    _x.label = 5;
                case 5:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    v = _a[_i];
                    return [4 /*yield*/, File.writeInt(ctx.file, v)];
                case 6:
                    _x.sent();
                    _x.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8:
                    _b = 0, _c = header.samples;
                    _x.label = 9;
                case 9:
                    if (!(_b < _c.length)) return [3 /*break*/, 12];
                    v = _c[_b];
                    return [4 /*yield*/, File.writeInt(ctx.file, v)];
                case 10:
                    _x.sent();
                    _x.label = 11;
                case 11:
                    _b++;
                    return [3 /*break*/, 9];
                case 12:
                    _d = 0, _e = header.dimensions;
                    _x.label = 13;
                case 13:
                    if (!(_d < _e.length)) return [3 /*break*/, 16];
                    v = _e[_d];
                    return [4 /*yield*/, File.writeDouble(ctx.file, v)];
                case 14:
                    _x.sent();
                    _x.label = 15;
                case 15:
                    _d++;
                    return [3 /*break*/, 13];
                case 16:
                    _f = 0, _g = header.origin;
                    _x.label = 17;
                case 17:
                    if (!(_f < _g.length)) return [3 /*break*/, 20];
                    v = _g[_f];
                    return [4 /*yield*/, File.writeDouble(ctx.file, v)];
                case 18:
                    _x.sent();
                    _x.label = 19;
                case 19:
                    _f++;
                    return [3 /*break*/, 17];
                case 20: 
                // 22:1  Spacegroup number
                return [4 /*yield*/, File.writeInt(ctx.file, header.spacegroupNumber)];
                case 21:
                    // 22:1  Spacegroup number
                    _x.sent();
                    _h = 0, _j = header.cellSize;
                    _x.label = 22;
                case 22:
                    if (!(_h < _j.length)) return [3 /*break*/, 25];
                    v = _j[_h];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 23:
                    _x.sent();
                    _x.label = 24;
                case 24:
                    _h++;
                    return [3 /*break*/, 22];
                case 25:
                    _k = 0, _l = header.cellAngles;
                    _x.label = 26;
                case 26:
                    if (!(_k < _l.length)) return [3 /*break*/, 29];
                    v = _l[_k];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 27:
                    _x.sent();
                    _x.label = 28;
                case 28:
                    _k++;
                    return [3 /*break*/, 26];
                case 29:
                    _m = 0, _o = header.means;
                    _x.label = 30;
                case 30:
                    if (!(_m < _o.length)) return [3 /*break*/, 33];
                    v = _o[_m];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 31:
                    _x.sent();
                    _x.label = 32;
                case 32:
                    _m++;
                    return [3 /*break*/, 30];
                case 33:
                    ctx.sigmasOffset = ctx.file.position;
                    _p = 0, _q = header.means;
                    _x.label = 34;
                case 34:
                    if (!(_p < _q.length)) return [3 /*break*/, 37];
                    v = _q[_p];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 35:
                    _x.sent();
                    _x.label = 36;
                case 36:
                    _p++;
                    return [3 /*break*/, 34];
                case 37:
                    _r = 0, _s = header.minimums;
                    _x.label = 38;
                case 38:
                    if (!(_r < _s.length)) return [3 /*break*/, 41];
                    v = _s[_r];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 39:
                    _x.sent();
                    _x.label = 40;
                case 40:
                    _r++;
                    return [3 /*break*/, 38];
                case 41:
                    _t = 0, _u = header.maximums;
                    _x.label = 42;
                case 42:
                    if (!(_t < _u.length)) return [3 /*break*/, 45];
                    v = _u[_t];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 43:
                    _x.sent();
                    _x.label = 44;
                case 44:
                    _t++;
                    return [3 /*break*/, 42];
                case 45:
                    _v = 0, _w = header.names;
                    _x.label = 46;
                case 46:
                    if (!(_v < _w.length)) return [3 /*break*/, 49];
                    n = _w[_v];
                    return [4 /*yield*/, File.writeString(ctx.file, n, 32)];
                case 47:
                    _x.sent();
                    _x.label = 48;
                case 48:
                    _v++;
                    return [3 /*break*/, 46];
                case 49:
                    // <BLOCK_00><BLOCK_01>...<BLOCK_0N>
                    // <BLOCK_K0><BLOCK_K1>...<BLOCK_KN>   
                    header.dataByteOffset = ctx.file.position;
                    return [2 /*return*/, header];
            }
        });
    });
}
exports.writeHeader = writeHeader;
function writeInfo(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var o, _i, _a, v, _b, _c, v, _d, _e, v;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    o = 0;
                    ctx.blockHeader.sigmas = ctx.sources.map(function (s) { return s.header.sigma; });
                    _i = 0, _a = ctx.sources;
                    _f.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    v = _a[_i];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v.header.sigma, ctx.sigmasOffset + o)];
                case 2:
                    _f.sent();
                    o += 4;
                    _f.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    ctx.blockHeader.minimums = ctx.sources.map(function (s) { return s.header.min; });
                    _b = 0, _c = ctx.sources;
                    _f.label = 5;
                case 5:
                    if (!(_b < _c.length)) return [3 /*break*/, 8];
                    v = _c[_b];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v.header.min, ctx.sigmasOffset + o)];
                case 6:
                    _f.sent();
                    o += 4;
                    _f.label = 7;
                case 7:
                    _b++;
                    return [3 /*break*/, 5];
                case 8:
                    ctx.blockHeader.maximums = ctx.sources.map(function (s) { return s.header.max; });
                    _d = 0, _e = ctx.sources;
                    _f.label = 9;
                case 9:
                    if (!(_d < _e.length)) return [3 /*break*/, 12];
                    v = _e[_d];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v.header.max, ctx.sigmasOffset + o)];
                case 10:
                    _f.sent();
                    o += 4;
                    _f.label = 11;
                case 11:
                    _d++;
                    return [3 /*break*/, 9];
                case 12: return [2 /*return*/];
            }
        });
    });
}
exports.writeInfo = writeInfo;
function updateProgress(progress, progressDone) {
    var old = (100 * progress.current / progress.max).toFixed(0);
    progress.current += progressDone;
    var $new = (100 * progress.current / progress.max).toFixed(0);
    if (old !== $new) {
        process.stdout.write("\rWriting data...    " + $new + "%");
    }
}
exports.updateProgress = updateProgress;
