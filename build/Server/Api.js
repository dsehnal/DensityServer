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
var Logger = require("./Utils/Logger");
var DataFormat = require("../Common/DataFormat");
function getOutputFilename(source, id, isBinary, box) {
    function n(s) { return (s || '').replace(/[ \n\t]/g, '').toLowerCase(); }
    function r(v) { return Math.round(10 * v) / 10; }
    var boxInfo = box.kind === 'Cell'
        ? 'cell'
        : (box.kind === 'Cartesian' ? 'cartn' : 'frac') + "-" + r(box.a[0]) + "_" + r(box.a[1]) + "_" + r(box.a[2]) + "_" + r(box.b[0]) + "_" + r(box.b[1]) + "_" + r(box.b[2]);
    return n(source) + "_" + n(id) + "-" + boxInfo + "." + (isBinary ? 'bcif' : 'cif');
}
exports.getOutputFilename = getOutputFilename;
function readHeader(filename, sourceId) {
    return __awaiter(this, void 0, void 0, function () {
        var file, header, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = void 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
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
                    Logger.errorPlain("Info " + sourceId, e_1);
                    return [2 /*return*/, void 0];
                case 5:
                    File.close(file);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function getHeaderJson(filename, sourceId) {
    return __awaiter(this, void 0, void 0, function () {
        var header, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Logger.logPlain('Header', sourceId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, readHeader(filename, sourceId)];
                case 2:
                    header = _a.sent();
                    return [2 /*return*/, JSON.stringify(header, null, 2)];
                case 3:
                    e_2 = _a.sent();
                    Logger.errorPlain("Header " + sourceId, e_2);
                    return [2 /*return*/, JSON.stringify({ isAvailable: false })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getHeaderJson = getHeaderJson;
function queryBox(params, outputProvider) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Query.execute(params, outputProvider)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.queryBox = queryBox;
