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
var Api = require("./server/api");
var Coordinate = require("./server/algebra/coordinate");
var LocalApi = require("./server/local-api");
var fs = require("fs");
function wrapResponse(fn) {
    var w = {
        open: function () {
            if (this.opened)
                return;
            this.file = fs.openSync(fn, 'w');
            this.opened = true;
        },
        writeBinary: function (data) {
            this.open();
            fs.writeSync(this.file, new Buffer(data));
            return true;
        },
        writeString: function (data) {
            this.open();
            fs.writeSync(this.file, data);
            return true;
        },
        end: function () {
            if (!this.opened || this.ended)
                return;
            fs.close(this.file, function () { });
            this.ended = true;
        },
        file: 0,
        ended: false,
        opened: false
    };
    return w;
}
function query(src, id, asBinary, box, detail, forcedSamplingLevel) {
    if (detail === void 0) { detail = 0; }
    return __awaiter(this, void 0, void 0, function () {
        var params, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        sourceFilename: "g:/test/mdb/" + src + "-" + id + ".mdb",
                        sourceId: src + "/" + id,
                        asBinary: asBinary,
                        box: box,
                        detail: detail,
                        forcedSamplingLevel: forcedSamplingLevel
                    };
                    res = function () { return wrapResponse("g:/test/" + Api.getOutputFilename(src, id, params)); };
                    return [4 /*yield*/, Api.queryBox(params, res)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var job, job1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    job = {
                        source: {
                            filename: "g:/test/mdb/xray-1tqn.mdb",
                            name: 'xray',
                            id: '1tqn',
                        },
                        query: {
                            kind: 'box',
                            space: 'cartesian',
                            bottomLeft: [-42.996, -64.169, -45.335],
                            topRight: [8.768, 15.316, 21.599]
                        },
                        params: {
                            forcedSamplingLevel: 2,
                            asBinary: true
                        },
                        outputFolder: 'g:/test/local-test'
                    };
                    job1 = {
                        source: {
                            filename: "g:/test/mdb/emd-8116.mdb",
                            name: 'emd',
                            id: '8116',
                        },
                        query: {
                            kind: 'cell'
                        },
                        params: {
                            detail: 4,
                            asBinary: true
                        },
                        outputFolder: 'g:/test/local-test'
                    };
                    LocalApi.run([job, job1]);
                    return [4 /*yield*/, query('xray', '1tqn', true, {
                            kind: 'Cartesian',
                            a: Coordinate.cartesian(-42.996, -64.169, -45.335),
                            b: Coordinate.cartesian(8.768, 15.316, 21.599)
                        }, 0, 1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, query('xray', '1tqn', true, {
                            kind: 'Cartesian',
                            a: Coordinate.cartesian(-42.996, -64.169, -45.335),
                            b: Coordinate.cartesian(8.768, 15.316, 21.599)
                        }, 0, 2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, query('xray', '1tqn', true, {
                            kind: 'Cartesian',
                            a: Coordinate.cartesian(-22.367, -33.367, -21.634),
                            b: Coordinate.cartesian(-7.106, -10.042, -0.937)
                        }, 0, 1)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, query('xray', '1tqn', true, {
                            kind: 'Cartesian',
                            a: Coordinate.cartesian(-22.367, -33.367, -21.634),
                            b: Coordinate.cartesian(-7.106, -10.042, -0.937)
                        }, 0, 2)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
run();
