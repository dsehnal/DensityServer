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
//import * as Box from './Server/Algebra/Box'
var Coordinate = require("./Server/Algebra/Coordinate");
var Query = require("./Server/Query/Execute");
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
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var params, params1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        sourceFilename: 'g:/test/mdb/xray-1cbs.mdb',
                        sourceId: 'x-ray/1cbs',
                        asBinary: false,
                        //box: { a: Coordinate.fractional([0.1,0.1,0.1]), b: Coordinate.fractional([1,1,1]) },
                        // box: { 
                        //     a: Coordinate.fractional([0.31883898467579275, 0.3379941099552041, 0.12689084713255028]),
                        //     b: Coordinate.fractional([0.6419057651331137, 0.7514086948151544, 0.4127947125514897]) 
                        // },
                        box: {
                            a: Coordinate.cartesian(14.555000305175781, 16.075000762939453, 9.847999572753906),
                            b: Coordinate.cartesian(29.30299949645996, 35.73699951171875, 32.03700065612793)
                        },
                    };
                    return [4 /*yield*/, Query.execute(params, function () { return wrapResponse('g:/test/1cbs_1.cif'); })];
                case 1:
                    _a.sent();
                    params1 = {
                        sourceFilename: 'g:/test/mdb/emd-8116.mdb',
                        sourceId: 'emd/zika',
                        asBinary: true,
                        //box: { a: Coordinate.fractional(0.1,0.1,0.1), b: Coordinate.fractional(0.3,0.3,0.3) },
                        box: { a: Coordinate.fractional(-0.5, -0.5, -0.5), b: Coordinate.fractional(0.5, 0.5, 0.5) },
                    };
                    return [4 /*yield*/, Query.execute(params1, function () { return wrapResponse('g:/test/zika_2.bcif'); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
run();
