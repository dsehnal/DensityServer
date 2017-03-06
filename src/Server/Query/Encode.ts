/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CIF from '../../lib/CIFTools'
import * as Data from  './DataModel'
import * as Coords from  '../Algebra/Coordinate'
import VERSION from '../Version'
import * as DataFormat from '../../Common/DataFormat'

interface ResultContext {
    query: Data.QueryContext,
    channelIndex: number
}

type Writer = CIF.Writer<ResultContext | Data.QueryContext>
type FieldDesc<T> = CIF.FieldDesc<T>
type CategoryInstance<T> = CIF.CategoryInstance<T>

import E = CIF.Binary.Encoder

function string<T>(name: string, v: (data: T, i: number) => string): FieldDesc<T> {
    return { name, string: v };
}

function int32<T>(name: string, v: (data: T, i: number) => number): FieldDesc<T> {
    return { name, string: (data, i) => '' + v(data, i), number: v, typedArray: Int32Array, encoder: E.by(E.byteArray) };
}

function float64<T>(name: string, v: (data: T, i: number) => number, precision = 1000000): FieldDesc<T> {
    return { name, string: (data, i) => '' + Math.round(precision * v(data, i)) / precision, number: v, typedArray: Float64Array, encoder: E.by(E.byteArray) };
}

interface _vd3d_Ctx {
    header: DataFormat.Header,
    channelIndex: number,
    grid: Coords.GridDomain<'Query'>,
    sampleRate: number
}

const _volume_data_3d_info_fields: FieldDesc<_vd3d_Ctx>[] = [
    string<_vd3d_Ctx>('name', ctx => ctx.header.channels[ctx.channelIndex].name),
        
    int32<_vd3d_Ctx>('axis_order[0]', ctx => ctx.header.axisOrder[0]),
    int32<_vd3d_Ctx>('axis_order[1]', ctx => ctx.header.axisOrder[1]),
    int32<_vd3d_Ctx>('axis_order[2]', ctx => ctx.header.axisOrder[2]),

    int32<_vd3d_Ctx>('origin[0]', ctx => ctx.grid.origin[0]),
    int32<_vd3d_Ctx>('origin[1]', ctx => ctx.grid.origin[1]),
    int32<_vd3d_Ctx>('origin[2]', ctx => ctx.grid.origin[2]),

    int32<_vd3d_Ctx>('dimensions[0]', ctx => ctx.grid.dimensions[0]),
    int32<_vd3d_Ctx>('dimensions[1]', ctx => ctx.grid.dimensions[1]),
    int32<_vd3d_Ctx>('dimensions[2]', ctx => ctx.grid.dimensions[2]),

    int32<_vd3d_Ctx>('sample_rate', ctx => ctx.sampleRate),
    int32<_vd3d_Ctx>('sample_count[0]', ctx => ctx.grid.sampleCount[0]),
    int32<_vd3d_Ctx>('sample_count[1]', ctx => ctx.grid.sampleCount[1]),
    int32<_vd3d_Ctx>('sample_count[2]', ctx => ctx.grid.sampleCount[2]),

    int32<_vd3d_Ctx>('spacegroup_number', ctx => ctx.header.spacegroup.number),

    float64<_vd3d_Ctx>('spacegroup_cell_size[0]', ctx => ctx.header.spacegroup.size[0], 1000),
    float64<_vd3d_Ctx>('spacegroup_cell_size[1]', ctx => ctx.header.spacegroup.size[1], 1000),
    float64<_vd3d_Ctx>('spacegroup_cell_size[2]', ctx => ctx.header.spacegroup.size[2], 1000),

    float64<_vd3d_Ctx>('spacegroup_cell_angles[0]', ctx => ctx.header.spacegroup.angles[0], 1000),
    float64<_vd3d_Ctx>('spacegroup_cell_angles[1]', ctx => ctx.header.spacegroup.angles[1], 1000),
    float64<_vd3d_Ctx>('spacegroup_cell_angles[2]', ctx => ctx.header.spacegroup.angles[2], 1000),

    float64<_vd3d_Ctx>('global_mean', ctx => ctx.header.channels[ctx.channelIndex].mean),
    float64<_vd3d_Ctx>('global_sigma', ctx => ctx.header.channels[ctx.channelIndex].sigma),
    float64<_vd3d_Ctx>('global_min', ctx => ctx.header.channels[ctx.channelIndex].min),
    float64<_vd3d_Ctx>('global_max', ctx => ctx.header.channels[ctx.channelIndex].max)
];

function _volume_data_3d_info(result: ResultContext) {
    const ctx: _vd3d_Ctx = {
        header: result.query.data.header,
        channelIndex: result.channelIndex,
        grid: result.query.gridDomain,
        sampleRate: result.query.sampling.rate
    }

    return <CategoryInstance<typeof ctx>>{
        data: ctx,
        count: 1,
        desc: {
            name: '_volume_data_3d_info',
            fields: _volume_data_3d_info_fields
        }
    };
}

function _volume_data_3d_str(ctx: DataFormat.ValueArray, i: number): string {
    return '' + Math.round(1000000 * ctx[i]) / 1000000;
}

function _volume_data_3d_number(ctx: DataFormat.ValueArray, i: number): number {
    return ctx[i];
}

function _volume_data_3d(ctx: ResultContext) {
    let data = ctx.query.result.values![ctx.channelIndex];

    let encoder: E;
    let typedArray: any;

    if (ctx.query.data.header.valueType === DataFormat.ValueType.Float32) {
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
        string: _volume_data_3d_str, 
        number: _volume_data_3d_number, 
        typedArray, 
        encoder
    }];

    return <CategoryInstance<typeof data>>{
        data,
        count: data.length,
        desc: {
            name: '_volume_data_3d',
            fields
        }
    };
}

const _density_server_result_fields: FieldDesc<Data.QueryContext>[] = [
    string<Data.QueryContext>('server_version', ctx => VERSION),        
    string<Data.QueryContext>('datetime_utc', ctx => new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')),
    string<Data.QueryContext>('guid', ctx => ctx.guid),
    string<Data.QueryContext>('is_empty', ctx => ctx.result.isEmpty ? 'yes' : 'no'),
    string<Data.QueryContext>('has_error', ctx => ctx.result.error ? 'yes' : 'no'),
    string<Data.QueryContext>('error', ctx => ctx.result.error!),
    string<Data.QueryContext>('query_source_id', ctx => ctx.params.sourceId),
    string<Data.QueryContext>('query_region_type', ctx => ctx.params.box.a.kind === Coords.Space.Cartesian ? 'cartesian' : 'fractional'),
    float64<Data.QueryContext>('query_region_a[0]', ctx => ctx.params.box.a[0]),
    float64<Data.QueryContext>('query_region_a[1]', ctx => ctx.params.box.a[1]),
    float64<Data.QueryContext>('query_region_a[2]', ctx => ctx.params.box.a[2]),     
    float64<Data.QueryContext>('query_region_b[0]', ctx => ctx.params.box.b[0]),
    float64<Data.QueryContext>('query_region_b[1]', ctx => ctx.params.box.b[1]),
    float64<Data.QueryContext>('query_region_b[2]', ctx => ctx.params.box.b[2])
]

function _density_server_result(ctx: Data.QueryContext) {
    return <CategoryInstance<Data.QueryContext>>{
        data: ctx,
        count: 1,
        desc: {
            name: '_density_server_result',
            fields: _density_server_result_fields
        }
    };
}

function write(writer: Writer, query: Data.QueryContext) {
    writer.startDataBlock('SERVER');
    writer.writeCategory(_density_server_result, [query]);

    const result = query.result;
    if (!result.isEmpty && !result.error && result.values) {
        const header = query.data.header;
        for (let i = 0; i < header.channels.length; i++) {
            writer.startDataBlock(header.channels[i].name);
            const ctx: ResultContext[] = [{ query, channelIndex: i }];

            writer.writeCategory(_volume_data_3d_info, ctx);
            writer.writeCategory(_volume_data_3d, ctx);
        }
    }
}

export default function encode(query: Data.QueryContext, output: CIF.OutputStream) {
    let w = query.params.asBinary 
        ? new CIF.Binary.Writer<ResultContext>(`DensityServer ${VERSION}`) 
        : new CIF.Text.Writer<ResultContext>();
    write(w, query);
    w.encode();
    w.flush(output);
}