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
function fillCube(ctx, values, u, v, height) {
    var oH = ctx.blockSize * u;
    var oK = ctx.blockSize * v;
    var sizeH = ctx.sampleCounts[0];
    var sizeHK = ctx.sampleCounts[0] * ctx.sampleCounts[1];
    var cH = Math.min(ctx.blockSize, ctx.sampleCounts[0] - oH);
    var cK = Math.min(ctx.blockSize, ctx.sampleCounts[1] - oK);
    var cL = height;
    var elementByteSize = ctx.sources[0].slice.data.elementByteSize;
    var isFloat = ctx.sources[0].slice.data.type === 0 /* Float32 */;
    var buffer = ctx.cubeBuffer;
    var offset = 0;
    for (var l = 0; l < cL; l++) {
        for (var k = 0; k < cK; k++) {
            for (var h = 0; h < cH; h++) {
                var t = values[oH + h + (k + oK) * sizeH + l * sizeHK];
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
function writeHeader(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var header, headers, _i, _a, v, _b, _c, v, _d, _e, v, _f, _g, v, _h, _j, v, _k, _l, v, _m, _o, v, _p, headers_1, h, _q, headers_2, h, _r, headers_3, h, _s, headers_4, h, _t, headers_5, h;
        return __generator(this, function (_u) {
            switch (_u.label) {
                case 0:
                    header = ctx.sources[0].header;
                    headers = ctx.sources.map(function (d) { return d.header; });
                    // Layout
                    // 1     Magic constant/byte order
                    return [4 /*yield*/, File.writeInt(ctx.file, 0x1237)];
                case 1:
                    // Layout
                    // 1     Magic constant/byte order
                    _u.sent();
                    // 1     Format Version
                    return [4 /*yield*/, File.writeInt(ctx.file, FORMAT_VERSION)];
                case 2:
                    // 1     Format Version
                    _u.sent();
                    // 1     N = Num densities
                    return [4 /*yield*/, File.writeInt(ctx.file, ctx.sources.length)];
                case 3:
                    // 1     N = Num densities
                    _u.sent();
                    ////////////////////////////////////////////////////////
                    // 0:1   Format ID (0 = float32 values, 1 = int8 values)
                    return [4 /*yield*/, File.writeInt(ctx.file, header.mode == 2 /* Float32 */ ? 0 : 1)];
                case 4:
                    ////////////////////////////////////////////////////////
                    // 0:1   Format ID (0 = float32 values, 1 = int8 values)
                    _u.sent();
                    _i = 0, _a = header.grid;
                    _u.label = 5;
                case 5:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    v = _a[_i];
                    return [4 /*yield*/, File.writeInt(ctx.file, v)];
                case 6:
                    _u.sent();
                    _u.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8: 
                // 4:1   Block size
                return [4 /*yield*/, File.writeInt(ctx.file, ctx.blockSize)];
                case 9:
                    // 4:1   Block size
                    _u.sent();
                    _b = 0, _c = header.axisOrder;
                    _u.label = 10;
                case 10:
                    if (!(_b < _c.length)) return [3 /*break*/, 13];
                    v = _c[_b];
                    return [4 /*yield*/, File.writeInt(ctx.file, v)];
                case 11:
                    _u.sent();
                    _u.label = 12;
                case 12:
                    _b++;
                    return [3 /*break*/, 10];
                case 13:
                    _d = 0, _e = header.extent;
                    _u.label = 14;
                case 14:
                    if (!(_d < _e.length)) return [3 /*break*/, 17];
                    v = _e[_d];
                    return [4 /*yield*/, File.writeInt(ctx.file, v)];
                case 15:
                    _u.sent();
                    _u.label = 16;
                case 16:
                    _d++;
                    return [3 /*break*/, 14];
                case 17:
                    _f = 0, _g = ctx.sampleCounts;
                    _u.label = 18;
                case 18:
                    if (!(_f < _g.length)) return [3 /*break*/, 21];
                    v = _g[_f];
                    return [4 /*yield*/, File.writeInt(ctx.file, v)];
                case 19:
                    _u.sent();
                    _u.label = 20;
                case 20:
                    _f++;
                    return [3 /*break*/, 18];
                case 21:
                    _h = 0, _j = header.origin;
                    _u.label = 22;
                case 22:
                    if (!(_h < _j.length)) return [3 /*break*/, 25];
                    v = _j[_h];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 23:
                    _u.sent();
                    _u.label = 24;
                case 24:
                    _h++;
                    return [3 /*break*/, 22];
                case 25: 
                // 17:1   Spacegroup number
                return [4 /*yield*/, File.writeInt(ctx.file, header.spacegroupNumber)];
                case 26:
                    // 17:1   Spacegroup number
                    _u.sent();
                    _k = 0, _l = header.cellSize;
                    _u.label = 27;
                case 27:
                    if (!(_k < _l.length)) return [3 /*break*/, 30];
                    v = _l[_k];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 28:
                    _u.sent();
                    _u.label = 29;
                case 29:
                    _k++;
                    return [3 /*break*/, 27];
                case 30:
                    _m = 0, _o = header.cellAngles;
                    _u.label = 31;
                case 31:
                    if (!(_m < _o.length)) return [3 /*break*/, 34];
                    v = _o[_m];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 32:
                    _u.sent();
                    _u.label = 33;
                case 33:
                    _m++;
                    return [3 /*break*/, 31];
                case 34:
                    _p = 0, headers_1 = headers;
                    _u.label = 35;
                case 35:
                    if (!(_p < headers_1.length)) return [3 /*break*/, 38];
                    h = headers_1[_p];
                    return [4 /*yield*/, File.writeFloat(ctx.file, h.mean)];
                case 36:
                    _u.sent();
                    _u.label = 37;
                case 37:
                    _p++;
                    return [3 /*break*/, 35];
                case 38:
                    ctx.sigmasOffset = ctx.file.position;
                    _q = 0, headers_2 = headers;
                    _u.label = 39;
                case 39:
                    if (!(_q < headers_2.length)) return [3 /*break*/, 42];
                    h = headers_2[_q];
                    return [4 /*yield*/, File.writeFloat(ctx.file, h.sigma)];
                case 40:
                    _u.sent();
                    _u.label = 41;
                case 41:
                    _q++;
                    return [3 /*break*/, 39];
                case 42:
                    _r = 0, headers_3 = headers;
                    _u.label = 43;
                case 43:
                    if (!(_r < headers_3.length)) return [3 /*break*/, 46];
                    h = headers_3[_r];
                    return [4 /*yield*/, File.writeFloat(ctx.file, h.min)];
                case 44:
                    _u.sent();
                    _u.label = 45;
                case 45:
                    _r++;
                    return [3 /*break*/, 43];
                case 46:
                    _s = 0, headers_4 = headers;
                    _u.label = 47;
                case 47:
                    if (!(_s < headers_4.length)) return [3 /*break*/, 50];
                    h = headers_4[_s];
                    return [4 /*yield*/, File.writeFloat(ctx.file, h.max)];
                case 48:
                    _u.sent();
                    _u.label = 49;
                case 49:
                    _s++;
                    return [3 /*break*/, 47];
                case 50:
                    _t = 0, headers_5 = headers;
                    _u.label = 51;
                case 51:
                    if (!(_t < headers_5.length)) return [3 /*break*/, 54];
                    h = headers_5[_t];
                    return [4 /*yield*/, File.writeString(ctx.file, h.name, 32)];
                case 52:
                    _u.sent();
                    _u.label = 53;
                case 53:
                    _t++;
                    return [3 /*break*/, 51];
                case 54: return [2 /*return*/];
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
