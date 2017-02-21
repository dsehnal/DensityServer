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
var File = require("../Utils/File");
function getElementByteSize(header) {
    if (header.formatId === 0 /* Float32 */)
        return 4;
    return 1;
}
exports.getElementByteSize = getElementByteSize;
function getArray(r, offset, count, step) {
    if (step === void 0) { step = 1; }
    var ret = [];
    for (var i = 0; i < count; i++) {
        ret[i] = r(offset + i * step);
    }
    return ret;
}
function readHeader(file) {
    return __awaiter(this, void 0, void 0, function () {
        var maxDensityCount, headerBaseSize, readSize, data, readInt, readFloat, readDouble, readString, numDensities, header;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    maxDensityCount = 4;
                    headerBaseSize = 29 * 4;
                    readSize = headerBaseSize + 4 * 4 * maxDensityCount + 32 * maxDensityCount;
                    return [4 /*yield*/, File.readBuffer(file, 0, readSize)];
                case 1:
                    data = (_a.sent()).buffer;
                    readInt = function (o) { return data.readInt32LE(o * 4); };
                    readFloat = function (o) { return data.readFloatLE(o * 4); };
                    readDouble = function (o) { return data.readDoubleLE(o * 4); };
                    readString = function (o) {
                        var bytes = [];
                        for (var i = 0; i < 32; i++)
                            bytes.push(data.readUInt8(4 * o + i));
                        return String.fromCharCode.apply(null, bytes).trim();
                    };
                    numDensities = readInt(1);
                    if (numDensities > maxDensityCount) {
                        throw Error('At most 4 density fields are supported per single file.');
                    }
                    header = {
                        version: readInt(0),
                        numDensities: numDensities,
                        formatId: readInt(2),
                        blockSize: readInt(3),
                        axisOrder: getArray(readInt, 4, 3),
                        samples: getArray(readInt, 7, 3),
                        dimensions: getArray(readDouble, 10, 3, 2),
                        origin: getArray(readDouble, 16, 3, 2),
                        spacegroupNumber: readInt(22),
                        cellSize: getArray(readFloat, 23, 3),
                        cellAngles: getArray(readFloat, 26, 3),
                        means: getArray(readFloat, 29, numDensities),
                        sigmas: getArray(readFloat, 29 + numDensities, numDensities),
                        minimums: getArray(readFloat, 29 + 2 * numDensities, numDensities),
                        maximums: getArray(readFloat, 29 + 3 * numDensities, numDensities),
                        names: getArray(readString, 29 + 4 * numDensities, numDensities, 8),
                        dataByteOffset: headerBaseSize + 4 * 4 * numDensities + 32 * numDensities
                    };
                    return [2 /*return*/, header];
            }
        });
    });
}
exports.readHeader = readHeader;
