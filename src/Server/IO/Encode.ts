/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CIF from '../lib/CIFTools'
import * as Data from  './DataModel'
import * as Coords from  './CoordinateAlgebra'
import VERSION from './Version'
import * as BlockFormat from '../Common/BlockFormat'

interface ResultContext {
    header: BlockFormat.Header,
    queryDomain: Coords.GridDomain<'Query'>,
    result: Data.QueryResult,
    dataIndex: number
}

interface ServerContext {
    params: Data.QueryParams,
    isEmpty: boolean
    error?: string
}

type Writer = CIF.Writer<ResultContext | ServerContext>
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

function _density_info(ctx: ResultContext) {
    let fields: FieldDesc<ResultContext>[] = [
        string(ctx, 'name', ctx => ctx.header.names[ctx.dataIndex]),
        
        int32(ctx, 'axis_order[0]', ctx => ctx.header.axisOrder[0]),
        int32(ctx, 'axis_order[1]', ctx => ctx.header.axisOrder[1]),
        int32(ctx, 'axis_order[2]', ctx => ctx.header.axisOrder[2]),

        int32(ctx, 'origin[0]', ctx => ctx.queryDomain.origin[0]),
        int32(ctx, 'origin[1]', ctx => ctx.queryDomain.origin[1]),
        int32(ctx, 'origin[2]', ctx => ctx.queryDomain.origin[2]),

        int32(ctx, 'dimensions[0]', ctx => ctx.queryDomain.dimensions[0]),
        int32(ctx, 'dimensions[1]', ctx => ctx.queryDomain.dimensions[1]),
        int32(ctx, 'dimensions[2]', ctx => ctx.queryDomain.dimensions[2]),

        int32(ctx, 'samples[0]', ctx => ctx.queryDomain.samples[0]),
        int32(ctx, 'samples[1]', ctx => ctx.queryDomain.samples[1]),
        int32(ctx, 'samples[2]', ctx => ctx.queryDomain.samples[2]),

        int32(ctx, 'spacegroup_number', ctx => ctx.header.spacegroupNumber),

        float64(ctx, 'cell_size[0]', ctx => ctx.header.cellSize[0], 1000),
        float64(ctx, 'cell_size[1]', ctx => ctx.header.cellSize[1], 1000),
        float64(ctx, 'cell_size[2]', ctx => ctx.header.cellSize[2], 1000),

        float64(ctx, 'cell_angles[0]', ctx => ctx.header.cellAngles[0], 1000),
        float64(ctx, 'cell_angles[1]', ctx => ctx.header.cellAngles[1], 1000),
        float64(ctx, 'cell_angles[2]', ctx => ctx.header.cellAngles[2], 1000),

        float64(ctx, 'mean', ctx => ctx.header.means[ctx.dataIndex]),
        float64(ctx, 'sigma', ctx => ctx.header.sigmas[ctx.dataIndex]),
    ];

    return <CategoryInstance<ResultContext>>{
        data: ctx,
        count: 1,
        desc: {
            name: '_density_info',
            fields
        }
    };
}

function _density_data(ctx: ResultContext) {
    let data = ctx.result.values![ctx.dataIndex];

    let mean = ctx.header.means[ctx.dataIndex];
    let sigma = ctx.header.sigmas[ctx.dataIndex];
    let precision = 1000000;
    let encoder: E;
    let typedArray: any;

    if (ctx.header.formatId === BlockFormat.FormatId.Float32) {
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
        float64(ctx, 'query_region_a[0]', ctx => ctx.params.box.a.coord[0]),
        float64(ctx, 'query_region_a[1]', ctx => ctx.params.box.a.coord[1]),
        float64(ctx, 'query_region_a[2]', ctx => ctx.params.box.a.coord[2]),     
        float64(ctx, 'query_region_b[0]', ctx => ctx.params.box.b.coord[0]),
        float64(ctx, 'query_region_b[1]', ctx => ctx.params.box.b.coord[1]),
        float64(ctx, 'query_region_b[2]', ctx => ctx.params.box.b.coord[2]),
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
    writer.writeCategory(_density_server_result, [{ 
        params: result.context.params, 
        isEmpty: !result.values,
        error: result.error 
    }]);

    if (!result.isEmpty && !result.error && result.values) {
        let { header } = result.context.data;
        for (let i = 0; i < header.numDensities; i++) {
            writer.startDataBlock(header.names[i]);
            let ctx: ResultContext = { 
                header,
                queryDomain: result.context.domain,
                result,
                dataIndex: i
            };

            writer.writeCategory(_density_info, [ctx]);
            writer.writeCategory(_density_data, [ctx]);
        }
    }
}

export function encode(output: CIF.OutputStream, result: Data.QueryResult) {
    let w = result.context.params.asBinary 
        ? new CIF.Binary.Writer<ResultContext>(`DensityServer ${VERSION}`) 
        : new CIF.Text.Writer<ResultContext>();
    write(w, result);
    w.encode();
    w.flush(output);
}