/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CCP4 = require("./CCP4");
var DataFormat = require("../Common/DataFormat");
var FORMAT_VERSION = '1.0.0';
function createHeader(ctx) {
    var header = ctx.channels[0].header;
    var grid = header.grid;
    function normalize(data) {
        return [data[0] / grid[0], data[1] / grid[1], data[2] / grid[2]];
    }
    return {
        formatVersion: FORMAT_VERSION,
        valueType: header.mode === 2 /* Float32 */ ? DataFormat.ValueType.Float32 : DataFormat.ValueType.Int8,
        blockSize: ctx.blockSize,
        axisOrder: header.axisOrder,
        origin: normalize(header.origin),
        dimensions: normalize(header.extent),
        spacegroup: { number: header.spacegroupNumber, size: header.cellSize, angles: header.cellAngles, isPeriodic: ctx.isPeriodic },
        channels: ctx.channels.map(function (c) { return ({
            name: c.header.name,
            mean: c.header.mean,
            sigma: c.header.sigma,
            min: c.header.min,
            max: c.header.max
        }); }),
        sampling: ctx.sampling.map(function (s) { return ({
            byteOffset: s.byteOffset,
            rate: s.rate,
            sampleCount: s.sampleCount
        }); })
    };
}
exports.createHeader = createHeader;
function samplingBlockCount(sampling, blockSize) {
    return sampling.sampleCount.map(function (c) { return Math.ceil(c / blockSize); }).reduce(function (c, v) { return c * v; }, 1);
}
exports.samplingBlockCount = samplingBlockCount;
