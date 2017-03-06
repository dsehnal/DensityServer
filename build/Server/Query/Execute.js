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
var DataFormat = require("../../Common/DataFormat");
var File = require("../../Common/File");
var Coords = require("../Algebra/Coordinate");
var Box = require("../Algebra/Box");
var Logger = require("../Utils/Logger");
var State_1 = require("../State");
var Identify_1 = require("./Identify");
var Compose_1 = require("./Compose");
var Encode_1 = require("./Encode");
function getTime() {
    var t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}
function generateUUID() {
    var d = getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}
function blockDomain(domain, blockSize) {
    var delta = Coords.fractional(blockSize * domain.delta[0], blockSize * domain.delta[1], blockSize * domain.delta[2]);
    return Coords.domain('Block', {
        origin: domain.origin,
        dimensions: domain.dimensions,
        delta: delta,
        sampleCount: Coords.sampleCounts(domain.dimensions, delta)
    });
}
exports.blockDomain = blockDomain;
function createSampling(header, index, dataOffset) {
    var sampling = header.sampling[index];
    var dataDomain = Coords.domain('Data', {
        origin: Coords.fractional(header.origin[0], header.origin[1], header.origin[2]),
        dimensions: Coords.fractional(header.dimensions[0], header.dimensions[1], header.dimensions[2]),
        delta: Coords.fractional(header.dimensions[0] / (sampling.sampleCount[0]), header.dimensions[1] / (sampling.sampleCount[1]), header.dimensions[2] / (sampling.sampleCount[2])),
        sampleCount: sampling.sampleCount
    });
    return {
        index: index,
        rate: sampling.rate,
        byteOffset: sampling.byteOffset + dataOffset,
        dataDomain: dataDomain,
        blockDomain: blockDomain(dataDomain, header.blockSize)
    };
}
function createDataContext(file) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, header, dataOffset, origin, dimensions;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, DataFormat.readHeader(file)];
                case 1:
                    _a = _b.sent(), header = _a.header, dataOffset = _a.dataOffset;
                    origin = Coords.fractional(header.origin[0], header.origin[1], header.origin[2]);
                    dimensions = Coords.fractional(header.dimensions[0], header.dimensions[1], header.dimensions[2]);
                    return [2 /*return*/, {
                            file: file,
                            header: header,
                            spacegroup: Coords.spacegroup(header.spacegroup),
                            dataBox: { a: origin, b: Coords.add(origin, dimensions) },
                            sampling: header.sampling.map(function (s, i) { return createSampling(header, i, dataOffset); })
                        }];
            }
        });
    });
}
function pickSampling(data, queryBox) {
    return data.sampling[0];
}
function createQueryContext(data, params, guid, serialNumber) {
    var inputQueryBox = params.box.a.kind === 1 /* Fractional */
        ? Box.fractionalBoxReorderAxes(params.box, data.header.axisOrder)
        : Box.cartesianToFractional(params.box, data.spacegroup, data.header.axisOrder);
    var queryBox;
    if (!data.header.spacegroup.isPeriodic) {
        if (!Box.areIntersecting(data.dataBox, inputQueryBox)) {
            return {
                guid: guid,
                serialNumber: serialNumber,
                data: data,
                params: params,
                sampling: data.sampling[0],
                fractionalBox: { a: Coords.fractional(0, 0, 0), b: Coords.fractional(0, 0, 0) },
                gridDomain: Box.fractionalToDomain({ a: Coords.fractional(0, 0, 0), b: Coords.fractional(0, 0, 0) }, 'Query', data.sampling[0].dataDomain.delta),
                result: { error: void 0, isEmpty: true }
            };
        }
        queryBox = Box.intersect(data.dataBox, inputQueryBox);
    }
    else {
        queryBox = inputQueryBox;
    }
    var sampling = pickSampling(data, queryBox);
    // snap the query box to the sampling grid:
    var fractionalBox = Box.gridToFractional(Box.fractionalToGrid(queryBox, sampling.dataDomain));
    return {
        guid: guid,
        serialNumber: serialNumber,
        data: data,
        params: params,
        sampling: sampling,
        fractionalBox: fractionalBox,
        gridDomain: Box.fractionalToDomain(fractionalBox, 'Query', sampling.dataDomain.delta),
        result: { isEmpty: false }
    };
}
function validateQueryContext(query) {
    // TODO
}
function allocateResult(query) {
    var size = query.gridDomain.sampleVolume;
    var numChannels = query.data.header.channels.length;
    query.result.values = [];
    for (var i = 0; i < numChannels; i++) {
        query.result.values.push(DataFormat.createValueArray(query.data.header.valueType, size));
    }
}
function _execute(file, params, guid, serialNumber, outputProvider) {
    return __awaiter(this, void 0, void 0, function () {
        var data, query, output, blocks, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createDataContext(file)];
                case 1:
                    data = _a.sent();
                    query = createQueryContext(data, params, guid, serialNumber);
                    output = void 0;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, 7, 8]);
                    if (!!query.result.isEmpty) return [3 /*break*/, 5];
                    // Step 2a: Validate query context
                    validateQueryContext(query);
                    blocks = Identify_1.default(query);
                    if (!(blocks.length === 0)) return [3 /*break*/, 3];
                    query.result.isEmpty = true;
                    return [3 /*break*/, 5];
                case 3:
                    query.result.isEmpty = false;
                    // Step 3a: Allocate space for result data
                    allocateResult(query);
                    // Step 3b: Compose the result data
                    return [4 /*yield*/, Compose_1.default(query, blocks)];
                case 4:
                    // Step 3b: Compose the result data
                    _a.sent();
                    _a.label = 5;
                case 5:
                    // Step 4: Encode the result
                    output = outputProvider();
                    Encode_1.default(query, output);
                    output.end();
                    return [3 /*break*/, 8];
                case 6:
                    e_1 = _a.sent();
                    query.result.error = "" + e_1;
                    query.result.isEmpty = true;
                    query.result.values = void 0;
                    try {
                        if (!output)
                            output = outputProvider();
                        Encode_1.default(query, output);
                    }
                    catch (f) {
                        throw f;
                    }
                    throw e_1;
                case 7:
                    if (output)
                        output.end();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function execute(params, outputProvider) {
    return __awaiter(this, void 0, void 0, function () {
        var start, guid, serialNumber, _a, a, b, sourceFile, e_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    start = getTime();
                    State_1.State.pendingQueries++;
                    guid = generateUUID();
                    serialNumber = State_1.State.querySerial++;
                    _a = params.box, a = _a.a, b = _a.b;
                    Logger.log("[GUID] " + guid, serialNumber);
                    Logger.log("[Id] " + params.sourceId, serialNumber);
                    Logger.log("[Box] " + (a.kind === 0 /* Cartesian */ ? 'cart' : 'frac') + " [" + a[0] + "," + a[1] + "," + a[2] + "] [" + b[0] + "," + b[1] + "," + b[2] + "]", serialNumber);
                    Logger.log("[Encoding] " + (params.asBinary ? 'bcif' : 'cif'), serialNumber);
                    sourceFile = void 0;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, File.openRead(params.sourceFilename)];
                case 2:
                    sourceFile = _b.sent();
                    return [4 /*yield*/, _execute(sourceFile, params, guid, serialNumber, outputProvider)];
                case 3:
                    _b.sent();
                    Logger.log("[OK]", serialNumber);
                    return [2 /*return*/, true];
                case 4:
                    e_2 = _b.sent();
                    Logger.log("[Error] " + e_2, serialNumber);
                    return [2 /*return*/, false];
                case 5:
                    File.close(sourceFile);
                    Logger.log("[Time] " + Math.round(getTime() - start) + "ms", serialNumber);
                    State_1.State.pendingQueries--;
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.execute = execute;
