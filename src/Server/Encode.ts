/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CIF from '../lib/CIFTools'
import * as Data from  './DataModel'
import VERSION from './Version'
import * as BlockFormat from '../Common/BlockFormat'

interface DataContext {
    density: Data.Context,
    data: Data.QueryData,
    params: Data.QueryParams,
    dataIndex: number
}

interface ServerContext {
    params: Data.QueryParams,
    isEmpty: boolean
    error?: string
}

type Writer = CIF.Writer<DataContext | ServerContext>
type FieldDesc<T> = CIF.FieldDesc<T>
type CategoryProvider = CIF.CategoryProvider
type CategoryInstance<T> = CIF.CategoryInstance<T>

import E = CIF.Binary.Encoder

function string<T>(ctx: T, name: string, v: (data: T, i: number) => string): FieldDesc<T> {
    return { name, string: v };
}

function int32<T>(ctx: T, name: string, v: (data: T, i: number) => number): FieldDesc<T> {
    return { name, string: (data, i) => '' + v(data, i), number: v, typedArray: Int32Array, encoder: E.by(E.byteArray) };
}

function float64<T>(ctx: T, name: string, v: (data: T, i: number) => number, precision = 1000000): FieldDesc<T> {
    return { name, string: (data, i) => '' + Math.round(precision * v(data, i)) / precision, number: v, typedArray: Float64Array, encoder: E.by(E.byteArray) };
}

function _density_info(ctx: DataContext) {
    let fields: FieldDesc<DataContext>[] = [
        string(ctx, 'name', ctx => ctx.density.header.names[ctx.dataIndex]),
        
        int32(ctx, 'axis_order[0]', ctx => ctx.density.header.axisOrder[0]),
        int32(ctx, 'axis_order[1]', ctx => ctx.density.header.axisOrder[1]),
        int32(ctx, 'axis_order[2]', ctx => ctx.density.header.axisOrder[2]),

        int32(ctx, 'origin[0]', ctx => ctx.data.box.a[0]),
        int32(ctx, 'origin[1]', ctx => ctx.data.box.a[1]),
        int32(ctx, 'origin[2]', ctx => ctx.data.box.a[2]),

        int32(ctx, 'dimensions[0]', ctx => ctx.data.box.b[0] - ctx.data.box.a[0]),
        int32(ctx, 'dimensions[1]', ctx => ctx.data.box.b[1] - ctx.data.box.a[1]),
        int32(ctx, 'dimensions[2]', ctx => ctx.data.box.b[2] - ctx.data.box.a[2]),

        int32(ctx, 'samples[0]', ctx => ctx.data.samples[0]),
        int32(ctx, 'samples[1]', ctx => ctx.data.samples[1]),
        int32(ctx, 'samples[2]', ctx => ctx.data.samples[2]),

        int32(ctx, 'spacegroup_number', ctx => ctx.density.header.spacegroupNumber),

        float64(ctx, 'cell_size[0]', ctx => ctx.density.header.cellSize[0], 1000),
        float64(ctx, 'cell_size[1]', ctx => ctx.density.header.cellSize[1], 1000),
        float64(ctx, 'cell_size[2]', ctx => ctx.density.header.cellSize[2], 1000),

        float64(ctx, 'cell_angles[0]', ctx => ctx.density.header.cellAngles[0], 1000),
        float64(ctx, 'cell_angles[1]', ctx => ctx.density.header.cellAngles[1], 1000),
        float64(ctx, 'cell_angles[2]', ctx => ctx.density.header.cellAngles[2], 1000),

        float64(ctx, 'mean', ctx => ctx.density.header.means[ctx.dataIndex]),
        float64(ctx, 'sigma', ctx => ctx.density.header.sigmas[ctx.dataIndex]),
    ];

    return <CategoryInstance<DataContext>>{
        data: ctx,
        count: 1,
        desc: {
            name: '_density_info',
            fields
        }
    };
}

function _density_data(ctx: DataContext) {
    let data = ctx.data.values[ctx.dataIndex];

    let mean = ctx.density.header.means[ctx.dataIndex];
    let sigma = ctx.density.header.sigmas[ctx.dataIndex];
    let precision = 1000000;
    let encoder: E;
    let typedArray: any;

    if (ctx.density.header.formatId === BlockFormat.FormatId.Float32) {
        let min: number, max: number;
        min = data[0], max = data[0];
        for (let i = 0, n = data.length; i < n; i++) {
            let v = data[i];
            if (v < min) min = v;
            else if (v > max) max = v;
        }
        typedArray = Float32Array;
        // encode into 255 steps and store each value in 1 byte.
        encoder = E.by(E.intervalQuantizaiton(min, max, 255, Uint8Array)).and(E.byteArray);
    } else {
        typedArray = Int8Array;
        // just encode the bytes
        encoder = E.by(E.byteArray)
    }

    let fields: FieldDesc<typeof data>[] = [{ 
        name: 'values', 
        string: (ctx, i) => '' + Math.round(precision * ctx[i]) / precision, 
        number: (ctx, i) => ctx[i], 
        typedArray, 
        encoder
    }];

    return <CategoryInstance<typeof data>>{
        data,
        count: data.length,
        desc: {
            name: '_density_data',
            fields
        }
    };
}

function _density_server_result(ctx: ServerContext) {
    let fields: FieldDesc<ServerContext>[] = [
        string(ctx, 'server_version', ctx => VERSION),        
        string(ctx, 'datetime', ctx => new Date().toLocaleString('en-US')),
        string(ctx, 'guid', ctx => ctx.params.guid),
        string(ctx, 'is_empty', ctx => ctx.isEmpty ? 'yes' : 'no'),
        string(ctx, 'has_error', ctx => ctx.error ? 'yes' : 'no'),
        string(ctx, 'error', ctx => ctx.error!),
        string(ctx, 'query_source', ctx => ctx.params.source),
        string(ctx, 'query_id', ctx => ctx.params.id),
        float64(ctx, 'query_region_a[0]', ctx => ctx.params.box.a[0]),
        float64(ctx, 'query_region_a[1]', ctx => ctx.params.box.a[1]),
        float64(ctx, 'query_region_a[2]', ctx => ctx.params.box.a[2]),     
        float64(ctx, 'query_region_b[0]', ctx => ctx.params.box.b[0]),
        float64(ctx, 'query_region_b[1]', ctx => ctx.params.box.b[1]),
        float64(ctx, 'query_region_b[2]', ctx => ctx.params.box.b[2]),
    ];

    return <CategoryInstance<ServerContext>>{
        data: ctx,
        count: 1,
        desc: {
            name: '_density_server_result',
            fields
        }
    };
}

function write(writer: Writer, result: Data.QueryResult) {
    writer.startDataBlock('SERVER');
    writer.writeCategory(_density_server_result, [{ params: result.params, isEmpty: !result.data || !result.data.result, error: result.error }]);

    if (result.data && result.data.result) {
        let { ctx:density, result:data } = result.data;
        for (let i = 0; i < density.header.numDensities; i++) {
            writer.startDataBlock(density.header.names[i]);
            let ctx: DataContext = { density, data: data!, dataIndex: i, params: result.params  };

            if (data) {
                writer.writeCategory(_density_info, [ctx]);
                writer.writeCategory(_density_data, [ctx]);
            }
        }
    }
}

export function encode(output: CIF.OutputStream, result: Data.QueryResult) {
    let w = result.params.asBinary ? new CIF.Binary.Writer<DataContext>(`DensityServer ${VERSION}`) : new CIF.Text.Writer<DataContext>();
    write(w, result);
    w.encode();
    w.flush(output);
}