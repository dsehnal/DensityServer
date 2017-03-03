// /*
//  * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
//  */
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
function readBlock(ctx, coord) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            throw '';
        });
    });
}
exports.default = readBlock;
// import * as File from '../Utils/File'
// import { Coords, Box } from './Transforms'
// import * as LA from '../Utils/LinearAlgebra'
// import * as BlockFormat from '../Common/BlockFormat'
// function createCoordinateContext(header: BlockFormat.Header): Data.Coordinates {
//     // const { blockSize, origin, dimensions, samples } = header;
//     // const skew = Coords.makeSkewMatrices(header);
//     // const voxelSize = [dimensions[0] / samples[0], dimensions[1] / samples[1], dimensions[1] / samples[1]]
//     // return {
//     //     isAsymmetric: header.spacegroupNumber <= 0,
//     //     blockCount: Coords.map(e => Math.ceil(e / blockSize) | 0, samples),
//     //     voxelSize,
//     //     ...skew,
//     //     dataBox: { a: origin, b: Coords.add(origin, dimensions) }
//     // };
//     return 0 as any;
// }
// export async function open(filename: string): Promise<Data.DataContext> {
//     let file = await File.openRead(filename);
//     try {
//         let header = await BlockFormat.readHeader(file);
//         let coordinates = createCoordinateContext(header);
//         return { file, header, coordinates }
//     } catch (e) {
//         File.close(file);
//         throw e;
//     }
// }
// export async function readBlock(ctx: Data.DataContext, sampling: Data.Sampling, coord: number[]): Promise<Data.MultiBlock> {
//     let { box, dimensions, dataOffset } = Box.getBlockMetrics(ctx, coord);
//     let count = dimensions[0] * dimensions[1] * dimensions[2];
//     let data = File.createTypedArrayBufferContext(ctx.header.numDensities * count, ctx.header.formatId === BlockFormat.FormatId.Float32 ? File.ValueType.Float32 : File.ValueType.Int8);
//     let values = await File.readTypedArray(data, ctx.file, dataOffset, ctx.header.numDensities * count, 0);
//     return {
//         coord,
//         dimensions,
//         box,
//         values
//     };
// }
