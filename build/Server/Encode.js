/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
var CIF = require("../lib/CIFTools");
var Version_1 = require("./Version");
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
function _density_info(ctx) {
    var fields = [
        string(ctx, 'name', function (ctx) { return ctx.density.header.names[ctx.dataIndex]; }),
        int32(ctx, 'grid[0]', function (ctx) { return ctx.density.header.gridSize[0]; }),
        int32(ctx, 'grid[1]', function (ctx) { return ctx.density.header.gridSize[1]; }),
        int32(ctx, 'grid[2]', function (ctx) { return ctx.density.header.gridSize[2]; }),
        int32(ctx, 'axis_order[0]', function (ctx) { return ctx.density.header.axisOrder[0]; }),
        int32(ctx, 'axis_order[1]', function (ctx) { return ctx.density.header.axisOrder[1]; }),
        int32(ctx, 'axis_order[2]', function (ctx) { return ctx.density.header.axisOrder[2]; }),
        int32(ctx, 'origin[0]', function (ctx) { return ctx.data.box.a[0]; }),
        int32(ctx, 'origin[1]', function (ctx) { return ctx.data.box.a[1]; }),
        int32(ctx, 'origin[2]', function (ctx) { return ctx.data.box.a[2]; }),
        int32(ctx, 'extent[0]', function (ctx) { return ctx.data.box.b[0] - ctx.data.box.a[0]; }),
        int32(ctx, 'extent[1]', function (ctx) { return ctx.data.box.b[1] - ctx.data.box.a[1]; }),
        int32(ctx, 'extent[2]', function (ctx) { return ctx.data.box.b[2] - ctx.data.box.a[2]; }),
        int32(ctx, 'spacegroup_number', function (ctx) { return ctx.density.header.spacegroupNumber; }),
        float64(ctx, 'cell_size[0]', function (ctx) { return ctx.density.header.cellSize[0]; }, 1000),
        float64(ctx, 'cell_size[1]', function (ctx) { return ctx.density.header.cellSize[1]; }, 1000),
        float64(ctx, 'cell_size[2]', function (ctx) { return ctx.density.header.cellSize[2]; }, 1000),
        float64(ctx, 'cell_angles[0]', function (ctx) { return ctx.density.header.cellAngles[0]; }, 1000),
        float64(ctx, 'cell_angles[1]', function (ctx) { return ctx.density.header.cellAngles[1]; }, 1000),
        float64(ctx, 'cell_angles[2]', function (ctx) { return ctx.density.header.cellAngles[2]; }, 1000),
        float64(ctx, 'mean', function (ctx) { return ctx.density.header.means[ctx.dataIndex]; }),
        float64(ctx, 'sigma', function (ctx) { return ctx.density.header.sigmas[ctx.dataIndex]; }),
    ];
    return {
        data: ctx,
        count: 1,
        desc: {
            name: '_density_info',
            fields: fields
        }
    };
}
function _density_data(ctx) {
    var data = ctx.data.values[ctx.dataIndex];
    var mean = ctx.density.header.means[ctx.dataIndex];
    var sigma = ctx.density.header.sigmas[ctx.dataIndex];
    var precision = 1000000;
    var min = data[0], max = data[0];
    for (var i = 0, n = data.length; i < n; i++) {
        var v = data[i];
        if (v < min)
            min = v;
        else if (v > max)
            max = v;
    }
    var fields = [{
            name: 'values',
            string: function (ctx, i) { return '' + Math.round(precision * ctx[i]) / precision; },
            number: function (ctx, i) { return ctx[i]; },
            typedArray: Float32Array,
            // encode into 255 steps and store each value in 1 byte.
            encoder: E.by(E.intervalQuantizaiton(min, max, 255, Uint8Array)).and(E.byteArray)
        }];
    return {
        data: data,
        count: data.length,
        desc: {
            name: '_density_data',
            fields: fields
        }
    };
}
function _density_server_result(ctx) {
    var fields = [
        string(ctx, 'server_version', function (ctx) { return Version_1.default; }),
        string(ctx, 'datetime', function (ctx) { return new Date().toLocaleString('en-US'); }),
        string(ctx, 'guid', function (ctx) { return ctx.params.guid; }),
        string(ctx, 'is_empty', function (ctx) { return ctx.isEmpty ? 'yes' : 'no'; }),
        string(ctx, 'has_error', function (ctx) { return ctx.error ? 'yes' : 'no'; }),
        string(ctx, 'error', function (ctx) { return ctx.error; }),
        string(ctx, 'query_source', function (ctx) { return ctx.params.source; }),
        string(ctx, 'query_id', function (ctx) { return ctx.params.id; }),
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
function write(writer, result) {
    writer.startDataBlock('SERVER');
    writer.writeCategory(_density_server_result, [{ params: result.params, isEmpty: !result.data || !result.data.result, error: result.error }]);
    if (result.data && result.data.result) {
        var _a = result.data, density = _a.ctx, data = _a.result;
        for (var i = 0; i < density.header.numDensities; i++) {
            writer.startDataBlock(density.header.names[i]);
            var ctx = { density: density, data: data, dataIndex: i, params: result.params };
            if (data) {
                writer.writeCategory(_density_info, [ctx]);
                writer.writeCategory(_density_data, [ctx]);
            }
        }
    }
}
function encode(output, result) {
    var w = result.params.asBinary ? new CIF.Binary.Writer("DensityServer " + Version_1.default) : new CIF.Text.Writer();
    write(w, result);
    w.encode();
    w.flush(output);
}
exports.encode = encode;
