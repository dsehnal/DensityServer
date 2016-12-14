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
var Query = require("./Query");
var Documentation_1 = require("./Documentation");
var ServerConfig_1 = require("../ServerConfig");
var Logger = require("../Utils/Logger");
exports.State = {
    pendingQueries: 0,
    shutdownOnZeroPending: false,
    querySerial: 0
};
function makePath(p) {
    return ServerConfig_1.default.apiPrefix + '/' + p;
}
function mapFile(type, id) {
    return ServerConfig_1.default.mapFile(type || '', id || '');
}
function getOutputFilename(source, id, isBinary, box) {
    function n(s) { return (s || '').replace(/[ \n\t]/g, '').toLowerCase(); }
    var b = box.a.map(function (a) { return Math.round(a); }).join('_') + '-' + box.b.map(function (a) { return Math.round(a); }).join('_');
    return n(source) + "_" + n(id) + "-" + b + "." + (isBinary ? 'bcif' : 'cif');
}
function wrapResponse(fn, res) {
    var w = {
        writeHeader: function (binary) {
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
        headerWritten: false
    };
    return w;
}
function queryDone() {
    exports.State.pendingQueries--;
    if (exports.State.shutdownOnZeroPending) {
        process.exit(0);
    }
}
function getTime() {
    var t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}
function generateUUID() {
    var d = new Date().getTime() + getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}
function init(app) {
    var _this = this;
    app.get(makePath(':source/:id/?$'), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var info, ret, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    exports.State.pendingQueries++;
                    Logger.log("[Info] " + req.params.source + "/" + req.params.id);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Query.info(mapFile(req.params.source, req.params.id))];
                case 2:
                    info = _a.sent();
                    ret = JSON.stringify(info, null, 2);
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'X-Requested-With'
                    });
                    res.write(ret);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    res.writeHead(404);
                    Logger.log("[Info] [Error] " + req.params.source + "/" + req.params.id + ": " + e_1);
                    return [3 /*break*/, 5];
                case 4:
                    res.end();
                    queryDone();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.get(makePath(':source/:id/:a1,:a2,:a3/:b1,:b2,:b3/?'), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var qs, guid, started, box, asBinary, fn, s, params, ok, e_2, ended;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    exports.State.pendingQueries++;
                    qs = ++exports.State.querySerial;
                    guid = generateUUID();
                    Logger.log("[GUID] " + guid, qs);
                    Logger.log("[Id] " + req.params.source + "/" + req.params.id, qs);
                    Logger.log("[Params] " + req.params.a1 + "," + req.params.a2 + "," + req.params.a3 + "/" + req.params.b1 + "," + req.params.b2 + "," + req.params.b3 + "/?text=" + (req.query.text !== '1' ? '0' : '1'), qs);
                    started = getTime();
                    box = {
                        a: [+req.params.a1, +req.params.a2, +req.params.a3],
                        b: [+req.params.b1, +req.params.b2, +req.params.b3]
                    };
                    asBinary = req.query.text !== '1';
                    fn = getOutputFilename(req.params.source, req.params.id, asBinary, box);
                    s = wrapResponse(fn, res);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    params = { asBinary: asBinary, box: box, id: req.params.id, source: req.params.source, guid: guid };
                    return [4 /*yield*/, Query.query(params, s)];
                case 2:
                    ok = _a.sent();
                    if (!ok) {
                        res.writeHead(404);
                        Logger.log('[Error] Failed.', qs);
                        return [2 /*return*/];
                    }
                    Logger.log("[OK]", qs);
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    if (!s.headerWritten)
                        res.writeHead(404);
                    Logger.log("[Error] " + e_2, qs);
                    return [3 /*break*/, 5];
                case 4:
                    res.end();
                    queryDone();
                    ended = getTime() - started;
                    Logger.log("[Time] " + Math.round(ended) + "ms", qs);
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
