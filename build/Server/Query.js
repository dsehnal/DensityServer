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
var IO = require("./IO");
var Encode = require("./Encode");
var File = require("../Utils/File");
var Transforms_1 = require("./Transforms");
var ServerConfig_1 = require("../ServerConfig");
function info(filename) {
    return __awaiter(this, void 0, void 0, function () {
        var fn, _a, header, info_1, file, md_1, dataInfo, i, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    fn = void 0;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    if (!filename)
                        return [2 /*return*/, { isAvailable: false }];
                    return [4 /*yield*/, IO.open(filename)];
                case 2:
                    _a = _b.sent(), header = _a.header, info_1 = _a.info, file = _a.file;
                    fn = file;
                    md_1 = ServerConfig_1.default.maxRequestDimension;
                    dataInfo = {};
                    for (i = 0; i < header.numDensities; i++) {
                        dataInfo[header.names[i].toUpperCase()] = {
                            mean: Math.round(100000 * header.means[i]) / 100000,
                            sigma: Math.round(100000 * header.sigmas[i]) / 100000,
                            min: Math.round(1000 * header.minimums[i]) / 1000,
                            max: Math.round(1000 * header.maximums[i]) / 1000
                        };
                    }
                    return [2 /*return*/, {
                            isAvailable: true,
                            maxQueryRegion: info_1.cellDimensions.map(function (d) { return Math.floor(d * md_1 - 0.1); }),
                            dataInfo: dataInfo
                        }];
                case 3:
                    e_1 = _b.sent();
                    return [2 /*return*/, { isAvailable: false }];
                case 4:
                    if (fn !== void 0)
                        File.close(fn);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.info = info;
function mapFile(source, id) {
    return ServerConfig_1.default.mapFile(source || '', id || '');
}
function query(params, stream) {
    return __awaiter(this, void 0, void 0, function () {
        var filename, _a, ctx, result, e_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    if (params.box.a.some(function (v) { return isNaN(v) || !isFinite(v); }) || params.box.b.some(function (v) { return isNaN(v) || !isFinite(v); })) {
                        return [2 /*return*/, false];
                    }
                    filename = mapFile(params.source, params.id);
                    if (!filename)
                        return [2 /*return*/, false];
                    return [4 /*yield*/, _query(filename, params, stream)];
                case 1:
                    _a = _b.sent(), ctx = _a.ctx, result = _a.result;
                    Encode.encode(stream, { params: params, data: { ctx: ctx, result: result } });
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _b.sent();
                    Encode.encode(stream, { params: params, error: '' + e_2 });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, true];
            }
        });
    });
}
exports.query = query;
function _query(filename, params, stream) {
    return __awaiter(this, void 0, void 0, function () {
        var ctx, mapped, blocks, result, _i, blocks_1, b;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, IO.open(filename)];
                case 1:
                    ctx = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 7, 8]);
                    mapped = Transforms_1.Box.map(ctx, params.box);
                    validateRegion(ctx, mapped);
                    blocks = Transforms_1.Query.findBlockIndices(ctx, mapped);
                    result = createQueryData(ctx, mapped);
                    if (!result)
                        return [2 /*return*/, { ctx: ctx, result: result }];
                    _i = 0, blocks_1 = blocks;
                    _a.label = 3;
                case 3:
                    if (!(_i < blocks_1.length))
                        return [3 /*break*/, 6];
                    b = blocks_1[_i];
                    return [4 /*yield*/, processBlock(ctx, result, b)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, { ctx: ctx, result: result }];
                case 7:
                    File.close(ctx.file);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function validateRegion(ctx, box) {
    var d = Transforms_1.Box.dims(box), m = ServerConfig_1.default.maxRequestDimension;
    if (d.some(function (d) { return d > m; })) {
        throw "The query dimensions ([" + d[0] + "," + d[1] + "," + d[2] + "]; in cell count) exceed the maximum supported values ([" + m + "," + m + "," + m + "]).";
    }
}
function createQueryData(ctx, mapped) {
    var box = mapped;
    if (ctx.info.isAsymmetric) {
        var t = Transforms_1.Box.intersect(ctx.info.dataBox, mapped);
        if (!t)
            return void 0;
        box = t;
    }
    var dimensions = Transforms_1.Box.dims(box);
    var size = dimensions[0] * dimensions[1] * dimensions[2];
    var values = [];
    for (var i = 0; i < ctx.header.numDensities; i++)
        values.push(new Float32Array(size));
    return { box: box, values: values };
}
function processBlock(ctx, data, coord) {
    return __awaiter(this, void 0, void 0, function () {
        var block, grid, overlaps, delta, a, b, k, j, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, IO.readBlock(ctx, coord)];
                case 1:
                    block = _a.sent();
                    if (ctx.info.isAsymmetric) {
                        Transforms_1.Query.fillData(data, block, [0, 0, 0]);
                        return [2 /*return*/];
                    }
                    grid = ctx.info.grid;
                    overlaps = Transforms_1.Box.zero();
                    if (!Transforms_1.Query.findOverlapTransformRange(data.box, block.box, grid, overlaps)) {
                        return [2 /*return*/];
                    }
                    delta = [0, 0, 0];
                    a = overlaps.a, b = overlaps.b;
                    for (k = a[2]; k <= b[2]; k++) {
                        delta[2] = k * grid[2];
                        for (j = a[1]; j <= b[1]; j++) {
                            delta[1] = j * grid[1];
                            for (i = a[0]; i <= b[0]; i++) {
                                delta[0] = i * grid[0];
                                Transforms_1.Query.fillData(data, block, delta);
                            }
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
