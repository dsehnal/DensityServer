/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CIF = require("../../lib/CIFTools");
var Coords = require("../Algebra/Coordinate");
var Version_1 = require("../Version");
var DataFormat = require("../../Common/DataFormat");
var E = CIF.Binary.Encoder;
function string(ctx, name, v) {
    return { name: name, string: v };
}
function int32(ctx, name, v) {
    return { name: name, string: function (data, i) { return '' + v(data, i); }, number: v, typedArray: Int32Array, encoder: E.by(E.byteArray) };
}
function float64(ctx, name, v, precision) {
    if (precision === void 0) { precision = 1000000; }
    return { name: name, string: function (data, i) { return '' + Math.round(precision * v(data, i)) / precision; }, number: v, typedArray: Float64Array, encoder: E.by(E.byteArray) };
}
function _volume_data_3d_info(result) {
    var ctx = {
        header: result.query.data.header,
        channelIndex: result.channelIndex,
        grid: result.query.gridDomain,
        sampleRate: result.query.sampling.rate
    };
    var fields = [
        string(ctx, 'name', function (ctx) { return ctx.header.channels[ctx.channelIndex].name; }),
        int32(ctx, 'axis_order[0]', function (ctx) { return ctx.header.axisOrder[0]; }),
        int32(ctx, 'axis_order[1]', function (ctx) { return ctx.header.axisOrder[1]; }),
        int32(ctx, 'axis_order[2]', function (ctx) { return ctx.header.axisOrder[2]; }),
        int32(ctx, 'origin[0]', function (ctx) { return ctx.grid.origin[0]; }),
        int32(ctx, 'origin[1]', function (ctx) { return ctx.grid.origin[1]; }),
        int32(ctx, 'origin[2]', function (ctx) { return ctx.grid.origin[2]; }),
        int32(ctx, 'dimensions[0]', function (ctx) { return ctx.grid.dimensions[0]; }),
        int32(ctx, 'dimensions[1]', function (ctx) { return ctx.grid.dimensions[1]; }),
        int32(ctx, 'dimensions[2]', function (ctx) { return ctx.grid.dimensions[2]; }),
        int32(ctx, 'sample_rate', function (ctx) { return ctx.sampleRate; }),
        int32(ctx, 'sample_count[0]', function (ctx) { return ctx.grid.sampleCount[0]; }),
        int32(ctx, 'sample_count[1]', function (ctx) { return ctx.grid.sampleCount[1]; }),
        int32(ctx, 'sample_count[2]', function (ctx) { return ctx.grid.sampleCount[2]; }),
        int32(ctx, 'spacegroup_number', function (ctx) { return ctx.header.spacegroup.number; }),
        float64(ctx, 'spacegroup_cell_size[0]', function (ctx) { return ctx.header.spacegroup.size[0]; }, 1000),
        float64(ctx, 'spacegroup_cell_size[1]', function (ctx) { return ctx.header.spacegroup.size[1]; }, 1000),
        float64(ctx, 'spacegroup_cell_size[2]', function (ctx) { return ctx.header.spacegroup.size[2]; }, 1000),
        float64(ctx, 'spacegroup_cell_angles[0]', function (ctx) { return ctx.header.spacegroup.angles[0]; }, 1000),
        float64(ctx, 'spacegroup_cell_angles[1]', function (ctx) { return ctx.header.spacegroup.angles[1]; }, 1000),
        float64(ctx, 'spacegroup_cell_angles[2]', function (ctx) { return ctx.header.spacegroup.angles[2]; }, 1000),
        float64(ctx, 'global_mean', function (ctx) { return ctx.header.channels[ctx.channelIndex].mean; }),
        float64(ctx, 'global_sigma', function (ctx) { return ctx.header.channels[ctx.channelIndex].sigma; }),
        float64(ctx, 'global_min', function (ctx) { return ctx.header.channels[ctx.channelIndex].min; }),
        float64(ctx, 'global_max', function (ctx) { return ctx.header.channels[ctx.channelIndex].max; }),
    ];
    return {
        data: ctx,
        count: 1,
        desc: {
            name: '_volume_data_3d_info',
            fields: fields
        }
    };
}
function _volume_data_3d(ctx) {
    var data = ctx.query.result.values[ctx.channelIndex];
    var precision = 1000000;
    var encoder;
    var typedArray;
    if (ctx.query.data.header.valueType === DataFormat.ValueType.Float32) {
        var min = void 0, max = void 0;
        min = data[0], max = data[0];
        for (var i = 0, n = data.length; i < n; i++) {
            var v = data[i];
            if (v < min)
                min = v;
            else if (v > max)
                max = v;
        }
        typedArray = Float32Array;
        // encode into 255 steps and store each value in 1 byte.
        encoder = E.by(E.intervalQuantizaiton(min, max, 255, Uint8Array)).and(E.byteArray);
    }
    else {
        typedArray = Int8Array;
        // just encode the bytes
        encoder = E.by(E.byteArray);
    }
    var fields = [{
            name: 'values',
            string: function (ctx, i) { return '' + Math.round(precision * ctx[i]) / precision; },
            number: function (ctx, i) { return ctx[i]; },
            typedArray: typedArray,
            encoder: encoder
        }];
    return {
        data: data,
        count: data.length,
        desc: {
            name: '_volume_data_3d',
            fields: fields
        }
    };
}
function _density_server_result(ctx) {
    var fields = [
        string(ctx, 'server_version', function (ctx) { return Version_1.default; }),
        string(ctx, 'datetime_utc', function (ctx) { return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''); }),
        string(ctx, 'guid', function (ctx) { return ctx.guid; }),
        string(ctx, 'is_empty', function (ctx) { return ctx.result.isEmpty ? 'yes' : 'no'; }),
        string(ctx, 'has_error', function (ctx) { return ctx.result.error ? 'yes' : 'no'; }),
        string(ctx, 'error', function (ctx) { return ctx.result.error; }),
        string(ctx, 'query_source_id', function (ctx) { return ctx.params.sourceId; }),
        string(ctx, 'query_region_type', function (ctx) { return ctx.params.box.a.kind === 0 /* Cartesian */ ? 'cartesian' : 'fractional'; }),
        float64(ctx, 'query_region_a[0]', function (ctx) { return ctx.params.box.a[0]; }),
        float64(ctx, 'query_region_a[1]', function (ctx) { return ctx.params.box.a[1]; }),
        float64(ctx, 'query_region_a[2]', function (ctx) { return ctx.params.box.a[2]; }),
        float64(ctx, 'query_region_b[0]', function (ctx) { return ctx.params.box.b[0]; }),
        float64(ctx, 'query_region_b[1]', function (ctx) { return ctx.params.box.b[1]; }),
        float64(ctx, 'query_region_b[2]', function (ctx) { return ctx.params.box.b[2]; }),
    ];
    return {
        data: ctx,
        count: 1,
        desc: {
            name: '_density_server_result',
            fields: fields
        }
    };
}
function write(writer, query) {
    writer.startDataBlock('SERVER');
    writer.writeCategory(_density_server_result, [query]);
    var result = query.result;
    if (!result.isEmpty && !result.error && result.values) {
        var header = query.data.header;
        for (var i = 0; i < header.channels.length; i++) {
            writer.startDataBlock(header.channels[i].name);
            var ctx = [{ query: query, channelIndex: i }];
            writer.writeCategory(_volume_data_3d_info, ctx);
            writer.writeCategory(_volume_data_3d, ctx);
        }
    }
}
function encode(query, output) {
    var w = query.params.asBinary
        ? new CIF.Binary.Writer("DensityServer " + Version_1.default)
        : new CIF.Text.Writer();
    write(w, query);
    w.encode();
    w.flush(output);
}
exports.default = encode;
