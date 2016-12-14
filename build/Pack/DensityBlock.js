/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
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
function writeHeader(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var header, _i, _a, v, _b, _c, v, _d, _e, v, _f, _g, v, _h, _j, v, _k, _l, v, _m, _o, v, _p, _q, v, _r, _s, v, _t, _u, v, _v, _w, v;
        return __generator(this, function (_x) {
            switch (_x.label) {
                case 0:
                    header = ctx.sources[0].header;
                    // Layout
                    // 1     Magic constant/byte order
                    return [4 /*yield*/, File.writeInt(ctx.file, 0x1237)];
                case 1:
                    // Layout
                    // 1     Magic constant/byte order
                    _x.sent();
                    // 1     N = Num densities
                    return [4 /*yield*/, File.writeInt(ctx.file, ctx.sources.length)];
                case 2:
                    // 1     N = Num densities
                    _x.sent();
                    ////////////////////////////////////////////////////////
                    // 0:1   Format ID (0 = float32 values)
                    return [4 /*yield*/, File.writeInt(ctx.file, 0)];
                case 3:
                    ////////////////////////////////////////////////////////
                    // 0:1   Format ID (0 = float32 values)
                    _x.sent();
                    _i = 0, _a = header.grid;
                    _x.label = 4;
                case 4:
                    if (!(_i < _a.length))
                        return [3 /*break*/, 7];
                    v = _a[_i];
                    return [4 /*yield*/, File.writeInt(ctx.file, v)];
                case 5:
                    _x.sent();
                    _x.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: 
                // 4:1   Block size
                return [4 /*yield*/, File.writeInt(ctx.file, ctx.blockSize)];
                case 8:
                    // 4:1   Block size
                    _x.sent();
                    _b = 0, _c = header.axisOrder;
                    _x.label = 9;
                case 9:
                    if (!(_b < _c.length))
                        return [3 /*break*/, 12];
                    v = _c[_b];
                    return [4 /*yield*/, File.writeInt(ctx.file, v)];
                case 10:
                    _x.sent();
                    _x.label = 11;
                case 11:
                    _b++;
                    return [3 /*break*/, 9];
                case 12:
                    _d = 0, _e = header.extent;
                    _x.label = 13;
                case 13:
                    if (!(_d < _e.length))
                        return [3 /*break*/, 16];
                    v = _e[_d];
                    return [4 /*yield*/, File.writeInt(ctx.file, v)];
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
                    if (!(_f < _g.length))
                        return [3 /*break*/, 20];
                    v = _g[_f];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 18:
                    _x.sent();
                    _x.label = 19;
                case 19:
                    _f++;
                    return [3 /*break*/, 17];
                case 20: 
                // 14:1   Spacegroup number
                return [4 /*yield*/, File.writeInt(ctx.file, header.spacegroupNumber)];
                case 21:
                    // 14:1   Spacegroup number
                    _x.sent();
                    _h = 0, _j = header.cellSize;
                    _x.label = 22;
                case 22:
                    if (!(_h < _j.length))
                        return [3 /*break*/, 25];
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
                    if (!(_k < _l.length))
                        return [3 /*break*/, 29];
                    v = _l[_k];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v)];
                case 27:
                    _x.sent();
                    _x.label = 28;
                case 28:
                    _k++;
                    return [3 /*break*/, 26];
                case 29:
                    _m = 0, _o = ctx.sources;
                    _x.label = 30;
                case 30:
                    if (!(_m < _o.length))
                        return [3 /*break*/, 33];
                    v = _o[_m];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v.header.mean)];
                case 31:
                    _x.sent();
                    _x.label = 32;
                case 32:
                    _m++;
                    return [3 /*break*/, 30];
                case 33:
                    ctx.sigmasOffset = ctx.file.position;
                    _p = 0, _q = ctx.sources;
                    _x.label = 34;
                case 34:
                    if (!(_p < _q.length))
                        return [3 /*break*/, 37];
                    v = _q[_p];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v.header.sigma)];
                case 35:
                    _x.sent();
                    _x.label = 36;
                case 36:
                    _p++;
                    return [3 /*break*/, 34];
                case 37:
                    _r = 0, _s = ctx.sources;
                    _x.label = 38;
                case 38:
                    if (!(_r < _s.length))
                        return [3 /*break*/, 41];
                    v = _s[_r];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v.header.min)];
                case 39:
                    _x.sent();
                    _x.label = 40;
                case 40:
                    _r++;
                    return [3 /*break*/, 38];
                case 41:
                    _t = 0, _u = ctx.sources;
                    _x.label = 42;
                case 42:
                    if (!(_t < _u.length))
                        return [3 /*break*/, 45];
                    v = _u[_t];
                    return [4 /*yield*/, File.writeFloat(ctx.file, v.header.max)];
                case 43:
                    _x.sent();
                    _x.label = 44;
                case 44:
                    _t++;
                    return [3 /*break*/, 42];
                case 45:
                    _v = 0, _w = ctx.sources;
                    _x.label = 46;
                case 46:
                    if (!(_v < _w.length))
                        return [3 /*break*/, 49];
                    v = _w[_v];
                    return [4 /*yield*/, File.writeString(ctx.file, v.header.name, 32)];
                case 47:
                    _x.sent();
                    _x.label = 48;
                case 48:
                    _v++;
                    return [3 /*break*/, 46];
                case 49: return [2 /*return*/];
            }
        });
    });
}
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
                    if (!(_i < _a.length))
                        return [3 /*break*/, 4];
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
                    if (!(_b < _c.length))
                        return [3 /*break*/, 8];
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
                    if (!(_d < _e.length))
                        return [3 /*break*/, 12];
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
function createCubeContext(ctx) {
    var src = ctx.sources[0];
    return {
        buffer: new Buffer(new ArrayBuffer(4 * ctx.blockSize * ctx.blockSize * ctx.blockSize)),
        size: ctx.blockSize,
        extent: src.header.extent,
        numU: Math.ceil(src.header.extent[0] / ctx.blockSize) | 0,
        numV: Math.ceil(src.header.extent[1] / ctx.blockSize) | 0
    };
}
function fillCube(slice, _a, u, v) {
    var size = _a.size, buffer = _a.buffer, extent = _a.extent;
    var oH = size * u;
    var oK = size * v;
    var sizeH = extent[0];
    var sizeHK = extent[0] * extent[1];
    var cH = Math.min(size, extent[0] - oH);
    var cK = Math.min(size, extent[1] - oK);
    var cL = slice.height;
    var values = slice.data.values;
    var offset = 0;
    for (var l = 0; l < cL; l++) {
        for (var k = 0; k < cK; k++) {
            for (var h = 0; h < cH; h++) {
                var t = values[oH + h + (k + oK) * sizeH + l * sizeHK];
                buffer.writeFloatLE(t, offset, true);
                offset += 4;
            }
        }
    }
    return offset;
}
function processSlice(ctx, cube, sliceIndex) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, src, v, u, _b, _c, src, numBytes;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _i = 0, _a = ctx.sources;
                    _d.label = 1;
                case 1:
                    if (!(_i < _a.length))
                        return [3 /*break*/, 4];
                    src = _a[_i];
                    return [4 /*yield*/, CCP4.readSlice(src, sliceIndex)];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    v = 0;
                    _d.label = 5;
                case 5:
                    if (!(v < cube.numV))
                        return [3 /*break*/, 12];
                    u = 0;
                    _d.label = 6;
                case 6:
                    if (!(u < cube.numU))
                        return [3 /*break*/, 11];
                    _b = 0, _c = ctx.sources;
                    _d.label = 7;
                case 7:
                    if (!(_b < _c.length))
                        return [3 /*break*/, 10];
                    src = _c[_b];
                    numBytes = fillCube(src.slice, cube, u, v);
                    return [4 /*yield*/, File.write(ctx.file, cube.buffer, numBytes)];
                case 8:
                    _d.sent();
                    ctx.progress++;
                    process.stdout.write("\rWriting blocks...  " + (100 * ctx.progress / ctx.progressMax).toFixed(0) + "%");
                    _d.label = 9;
                case 9:
                    _b++;
                    return [3 /*break*/, 7];
                case 10:
                    u++;
                    return [3 /*break*/, 6];
                case 11:
                    v++;
                    return [3 /*break*/, 5];
                case 12: return [2 /*return*/];
            }
        });
    });
}
function processBlocks(numSlices, ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var cube, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cube = createCubeContext(ctx);
                    ctx.progressMax = cube.numU * cube.numV * numSlices * ctx.sources.length;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < numSlices))
                        return [3 /*break*/, 4];
                    return [4 /*yield*/, processSlice(ctx, cube, i)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getTime() {
    var t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}
function create(filename, sourceDensities, blockSize) {
    return __awaiter(this, void 0, void 0, function () {
        var startedTime, files, sources, _i, sourceDensities_1, s, _a, _b, _c, ctx_1, _d, _e, sources_1, s, isOk, time, _f, files_1, f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    startedTime = getTime();
                    if (!sourceDensities.length) {
                        throw Error('Specify at least one source density.');
                    }
                    console.log("Block Size: " + blockSize + ".");
                    process.stdout.write('Initializing... ');
                    files = [];
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, , 10, 11]);
                    sources = [];
                    _i = 0, sourceDensities_1 = sourceDensities;
                    _g.label = 2;
                case 2:
                    if (!(_i < sourceDensities_1.length))
                        return [3 /*break*/, 5];
                    s = sourceDensities_1[_i];
                    _b = (_a = sources).push;
                    return [4 /*yield*/, CCP4.open(s.name, s.filename, blockSize)];
                case 3:
                    _b.apply(_a, [_g.sent()]);
                    _g.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    _d = {};
                    return [4 /*yield*/, File.createFile(filename)];
                case 6:
                    ctx_1 = (_d.file = _g.sent(),
                        _d.sources = sources,
                        _d.blockSize = blockSize,
                        _d.sigmasOffset = 0,
                        _d.progress = 0,
                        _d.progressMax = 0,
                        _d);
                    files.push(ctx_1.file.file);
                    for (_e = 0, sources_1 = sources; _e < sources_1.length; _e++) {
                        s = sources_1[_e];
                        files.push(s.file);
                    }
                    process.stdout.write('   done.\n');
                    isOk = ctx_1.sources.reduce(function (ok, s) { return ok && CCP4.compareHeaders(ctx_1.sources[0].header, s.header); }, true);
                    if (!isOk) {
                        throw new Error('Input file headers are not compatible (different grid, etc.).');
                    }
                    process.stdout.write('Writing header... ');
                    return [4 /*yield*/, writeHeader(ctx_1)];
                case 7:
                    _g.sent();
                    process.stdout.write(' done.\n');
                    process.stdout.write('Writing blocks... ');
                    return [4 /*yield*/, processBlocks(ctx_1.sources[0].numSlices, ctx_1)];
                case 8:
                    _g.sent();
                    process.stdout.write('\rWriting blocks...  done.\n');
                    process.stdout.write('Updating info... ');
                    return [4 /*yield*/, writeInfo(ctx_1)];
                case 9:
                    _g.sent();
                    process.stdout.write('done.\n');
                    time = getTime() - startedTime;
                    console.log("[Done] " + time.toFixed(0) + "ms.");
                    return [3 /*break*/, 11];
                case 10:
                    for (_f = 0, files_1 = files; _f < files_1.length; _f++) {
                        f = files_1[_f];
                        File.close(f);
                    }
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
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
