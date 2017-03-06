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
var File = require("../Common/File");
var Query = require("./Query/Execute");
var Coords = require("./Algebra/Coordinate");
var Documentation_1 = require("./Documentation");
var ServerConfig_1 = require("../ServerConfig");
var Logger = require("./Utils/Logger");
var DataFormat = require("../Common/DataFormat");
var State_1 = require("./State");
function makePath(p) {
    return ServerConfig_1.default.apiPrefix + '/' + p;
}
function mapFile(type, id) {
    return ServerConfig_1.default.mapFile(type || '', id || '');
}
function getOutputFilename(source, id, isBinary, _a) {
    var a = _a.a, b = _a.b;
    function n(s) { return (s || '').replace(/[ \n\t]/g, '').toLowerCase(); }
    function r(v) { return Math.round(10 * v) / 10; }
    var box = r(a[0]) + "_" + r(a[1]) + "+" + r(a[2]) + "_" + r(b[0]) + "_" + r(b[1]) + "+" + r(b[2]);
    return n(source) + "_" + n(id) + "-" + box + "." + (isBinary ? 'bcif' : 'cif');
}
function wrapResponse(fn, res) {
    var w = {
        do404: function () {
            if (!this.headerWritten) {
                res.writeHead(404);
                this.headerWritten = true;
            }
            this.end();
        },
        writeHeader: function (binary) {
            if (this.headerWritten)
                return;
            res.writeHead(200, {
                'Content-Type': binary ? 'application/octet-stream' : 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'X-Requested-With',
                'Content-Disposition': "inline; filename=\"" + fn + "\""
            });
            this.headerWritten = true;
        },
        writeBinary: function (data) {
            if (!this.headerWritten)
                this.writeHeader(true);
            return res.write(new Buffer(data.buffer));
        },
        writeString: function (data) {
            if (!this.headerWritten)
                this.writeHeader(false);
            return res.write(data);
        },
        end: function () {
            if (this.ended)
                return;
            res.end();
            this.ended = true;
        },
        ended: false,
        headerWritten: false
    };
    return w;
}
function queryDone() {
    if (State_1.State.shutdownOnZeroPending) {
        process.exit(0);
    }
}
function readHeader(src, id) {
    return __awaiter(this, void 0, void 0, function () {
        var file, filename, header, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = void 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    filename = mapFile(src, id);
                    if (!filename)
                        return [2 /*return*/, void 0];
                    return [4 /*yield*/, File.openRead(filename)];
                case 2:
                    file = _a.sent();
                    return [4 /*yield*/, DataFormat.readHeader(file)];
                case 3:
                    header = _a.sent();
                    return [2 /*return*/, header.header];
                case 4:
                    e_1 = _a.sent();
                    Logger.log("[Info] [Error] " + src + "/" + id + ": " + e_1);
                    return [2 /*return*/, void 0];
                case 5:
                    File.close(file);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function init(app) {
    var _this = this;
    // Header
    app.get(makePath(':source/:id/?$'), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var headerWritten, header, json, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Logger.log("[Info] " + req.params.source + "/" + req.params.id);
                    headerWritten = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, readHeader(req.params.source, req.params.id)];
                case 2:
                    header = _a.sent();
                    if (header) {
                        json = JSON.stringify(header, null, 2);
                        res.writeHead(200, {
                            'Content-Type': 'application/json; charset=utf-8',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'X-Requested-With'
                        });
                        headerWritten = true;
                        res.write(json);
                    }
                    else {
                        res.writeHead(404);
                        headerWritten = true;
                    }
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    Logger.log("[Info] [Error] " + req.params.source + "/" + req.params.id + ": " + e_2);
                    if (!headerWritten) {
                        res.writeHead(404);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    res.end();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // Box /:src/:id/:a1,:a2,:a3/:b1,:b2,:b3?text=0|1&space=cartesian|fractional
    // Optional param
    app.get(makePath(':source/:id/box/:a1,:a2,:a3/:b1,:b2,:b3/?'), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var a, b, isCartesian, box, asBinary, outputFilename, response, sourceFilename, params, ok, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    a = [+req.params.a1, +req.params.a2, +req.params.a3];
                    b = [+req.params.b1, +req.params.b2, +req.params.b3];
                    isCartesian = (req.query.space || '').toLowerCase() !== 'fractional';
                    box = isCartesian
                        ? { a: Coords.cartesian(a[0], a[1], a[2]), b: Coords.cartesian(b[0], b[1], b[2]) }
                        : { a: Coords.fractional(a[0], a[1], a[2]), b: Coords.fractional(b[0], b[1], b[2]) };
                    asBinary = req.query.text !== '1';
                    outputFilename = getOutputFilename(req.params.source, req.params.id, asBinary, box);
                    response = wrapResponse(outputFilename, res);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    sourceFilename = mapFile(req.params.source, req.params.id);
                    if (!sourceFilename) {
                        response.do404();
                        return [2 /*return*/];
                    }
                    params = {
                        sourceFilename: sourceFilename,
                        sourceId: req.params.source + "/" + req.params.id,
                        asBinary: asBinary,
                        box: box,
                    };
                    return [4 /*yield*/, Query.execute(params, function () { return response; })];
                case 2:
                    ok = _a.sent();
                    if (!ok) {
                        response.do404();
                        return [2 /*return*/];
                    }
                    return [3 /*break*/, 5];
                case 3:
                    e_3 = _a.sent();
                    Logger.log("[Error] " + e_3);
                    response.do404();
                    return [3 /*break*/, 5];
                case 4:
                    response.end();
                    queryDone();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.get('*', function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(Documentation_1.default);
    });
}
exports.init = init;
