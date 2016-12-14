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
var fs = require("fs");
var path = require("path");
var isNativeEndian = new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412;
function openRead(filename) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (res, rej) {
                    fs.open(filename, 'r', function (err, file) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (err) {
                                rej(err);
                                return [2 /*return*/];
                            }
                            try {
                                res(file);
                            }
                            catch (e) {
                                fs.close(file);
                            }
                            return [2 /*return*/];
                        });
                    }); });
                })];
        });
    });
}
exports.openRead = openRead;
function readBuffer(file, position, sizeOrBuffer, size) {
    return new Promise(function (res, rej) {
        if (typeof sizeOrBuffer === 'number') {
            var buff = new Buffer(new ArrayBuffer(sizeOrBuffer));
            fs.read(file, buff, 0, sizeOrBuffer, position, function (err, bytesRead, buffer) {
                if (err) {
                    rej(err);
                    return;
                }
                res({ bytesRead: bytesRead, buffer: buffer });
            });
        }
        else {
            if (size === void 0) {
                rej('readBuffeR: Specify size.');
                return;
            }
            fs.read(file, sizeOrBuffer, 0, size, position, function (err, bytesRead, buffer) {
                if (err) {
                    rej(err);
                    return;
                }
                res({ bytesRead: bytesRead, buffer: buffer });
            });
        }
    });
}
exports.readBuffer = readBuffer;
function writeBuffer(file, position, buffer, size) {
    return new Promise(function (res, rej) {
        fs.write(file, buffer, 0, size !== void 0 ? size : buffer.length, position, function (err, written) {
            if (err)
                rej(err);
            else
                res(written);
        });
    });
}
exports.writeBuffer = writeBuffer;
var smallBufferSize = 128;
function makeDir(path, root) {
    var dirs = path.split(/\/|\\/g), dir = dirs.shift();
    root = (root || '') + dir + '/';
    try {
        fs.mkdirSync(root);
    }
    catch (e) {
        if (!fs.statSync(root).isDirectory())
            throw new Error(e);
    }
    return !dirs.length || makeDir(dirs.join('/'), root);
}
function createFile(filename) {
    return new Promise(function (res, rej) {
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);
        makeDir(path.dirname(filename));
        fs.open(filename, 'w', function (err, file) {
            if (err)
                rej(err);
            else
                res({ file: file, position: 0, smallBuffer: new Buffer(new ArrayBuffer(smallBufferSize)) });
        });
    });
}
exports.createFile = createFile;
function close(file) {
    fs.close(file);
}
exports.close = close;
function writeInt(ctx, value) {
    return __awaiter(this, void 0, void 0, function () {
        var written;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ctx.smallBuffer.writeInt32LE(value, 0);
                    return [4 /*yield*/, writeBuffer(ctx.file, ctx.position, ctx.smallBuffer, 4)];
                case 1:
                    written = _a.sent();
                    ctx.position += written;
                    return [2 /*return*/];
            }
        });
    });
}
exports.writeInt = writeInt;
function writeFloat(ctx, value, position) {
    return __awaiter(this, void 0, void 0, function () {
        var written;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ctx.smallBuffer.writeFloatLE(value, 0);
                    if (!(position === void 0))
                        return [3 /*break*/, 2];
                    return [4 /*yield*/, writeBuffer(ctx.file, ctx.position, ctx.smallBuffer, 4)];
                case 1:
                    written = _a.sent();
                    ctx.position += written;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, writeBuffer(ctx.file, position, ctx.smallBuffer, 4)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.writeFloat = writeFloat;
function writeString(ctx, value, width) {
    return __awaiter(this, void 0, void 0, function () {
        var i, written;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (value.length > width || width > smallBufferSize)
                        throw Error('The string exceeds the maximum length.');
                    for (i = 0; i < value.length; i++) {
                        if (value.charCodeAt(i) >= 0x7f)
                            throw Error('Only one byte UTF8 strings can be written.');
                    }
                    value += new Array(width - value.length + 1).join(' ');
                    ctx.smallBuffer.write(value);
                    return [4 /*yield*/, writeBuffer(ctx.file, ctx.position, ctx.smallBuffer, width)];
                case 1:
                    written = _a.sent();
                    ctx.position += written;
                    return [2 /*return*/];
            }
        });
    });
}
exports.writeString = writeString;
function write(ctx, value, size) {
    return __awaiter(this, void 0, void 0, function () {
        var written;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, writeBuffer(ctx.file, ctx.position, value, size)];
                case 1:
                    written = _a.sent();
                    ctx.position += written;
                    return [2 /*return*/];
            }
        });
    });
}
exports.write = write;
function createFloat32ArrayContext(size) {
    var arrayBuffer = new ArrayBuffer(4 * size);
    var readBuffer = new Buffer(arrayBuffer);
    var valuesBuffer = isNativeEndian ? arrayBuffer : new ArrayBuffer(4 * size);
    return {
        readBuffer: readBuffer,
        valuesBuffer: new Uint8Array(valuesBuffer),
        values: new Float32Array(valuesBuffer)
    };
}
exports.createFloat32ArrayContext = createFloat32ArrayContext;
function readFloat32Array(ctx, file, position, count) {
    return __awaiter(this, void 0, void 0, function () {
        function fixEndian() {
            var source = ctx.readBuffer;
            var target = ctx.valuesBuffer;
            for (var o = 0; o < byteCount; o += 4) {
                target[o + 3] = source[o + 0];
                target[o + 2] = source[o + 1];
                target[o + 1] = source[o + 2];
                target[o + 0] = source[o + 3];
            }
        }
        var byteCount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    byteCount = 4 * count;
                    return [4 /*yield*/, readBuffer(file, position, ctx.readBuffer, byteCount)];
                case 1:
                    _a.sent();
                    if (!isNativeEndian)
                        fixEndian();
                    return [2 /*return*/, ctx.values];
            }
        });
    });
}
exports.readFloat32Array = readFloat32Array;
