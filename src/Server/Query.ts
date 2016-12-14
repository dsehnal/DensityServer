/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'
import * as IO from './IO'
import * as Encode from './Encode'
import * as File from '../Utils/File'
import * as CIFTools from '../lib/CIFTools'
import { Coords, Box, Query } from './Transforms'
import ServerConfig from '../ServerConfig'

import * as fs from 'fs'

export async function info(filename: string | undefined) {
    let fn: number | undefined = void 0;

    try {
        if (!filename) return { isAvailable: false };

        let { header, info, file } = await IO.open(filename);
        fn = file;
        let md = ServerConfig.maxRequestDimension;

        let dataInfo: any = { };
        for (let i = 0; i < header.numDensities; i++) {
            dataInfo[header.names[i].toUpperCase()] = {
                mean: Math.round(100000 * header.means[i]) / 100000,
                sigma: Math.round(100000 * header.sigmas[i]) / 100000,  
                min: Math.round(1000 * header.minimums[i]) / 1000, 
                max: Math.round(1000 * header.maximums[i]) / 1000
            };
        }

        return {
            isAvailable: true,
            maxQueryRegion: info.cellDimensions.map(d => Math.floor(d * md - 0.1)),
            dataInfo            
        }
    } catch (e) {
        return { isAvailable: false };
    } finally {
        if (fn !== void 0) File.close(fn);
    }
}

function mapFile(source: string, id: string) {
    return ServerConfig.mapFile(source || '', id || '');
}

export async function query(params: Data.QueryParams, stream: CIFTools.OutputStream) {
    try {
        if (params.box.a.some(v => isNaN(v) || !isFinite(v)) || params.box.b.some(v => isNaN(v) || !isFinite(v))) { 
            return false;
        }

        let filename = mapFile(params.source, params.id);
        if (!filename) return false;
        let { ctx, result } = await _query(filename, params, stream);
        Encode.encode(stream, { params, data: { ctx, result } });
    } catch (e) {
        Encode.encode(stream, { params, error: '' + e });
    }
    return true;
} 

async function _query(filename: string, params: Data.QueryParams, stream: CIFTools.OutputStream) {
    let ctx = await IO.open(filename);

    try {
        let mapped = Box.map(ctx, params.box);
        validateRegion(ctx, mapped);

        let blocks = Query.findBlockIndices(ctx, mapped);
        let result = createQueryData(ctx, mapped);

        if (!result) return { ctx, result };

        for (let b of blocks) {
            await processBlock(ctx, result, b);
        }

        return { ctx, result };
    } finally {
        File.close(ctx.file);
    }
}

function validateRegion(ctx: Data.Context, box: Data.Box) {
    let d = Box.dims(box), m = ServerConfig.maxRequestDimension;
    if (d.some(d => d > m)) {
        throw `The query dimensions ([${d[0]},${d[1]},${d[2]}]; in cell count) exceed the maximum supported values ([${m},${m},${m}]).`;
    }
}

function createQueryData(ctx: Data.Context, mapped: Data.Box): Data.QueryData | undefined {
    let box = mapped;
    if (ctx.info.isAsymmetric) {
        let t =  Box.intersect(ctx.info.dataBox, mapped);
        if (!t) return void 0;
        box = t;
    }

    let dimensions = Box.dims(box);
    let size = dimensions[0] * dimensions[1] * dimensions[2];
    let values: Float32Array[] = [];
    for (let i = 0; i < ctx.header.numDensities; i++) values.push(new Float32Array(size));
    return { box, values };    
}

async function processBlock(ctx: Data.Context, data: Data.QueryData, coord: number[]) {
    let block = await IO.readBlock(ctx, coord);
    
    if (ctx.info.isAsymmetric) {
        Query.fillData(data, block, [0, 0, 0]);
        return;
    } 

    let { grid } = ctx.info;
    let overlaps = Box.zero();        
    if (!Query.findOverlapTransformRange(data.box, block.box, grid, overlaps)) {
        return;
    }

    let delta = [0,0,0];
    let { a, b } = overlaps;

    for (let k = a[2]; k <= b[2]; k++) {
        delta[2] = k * grid[2];
        for (let j = a[1]; j <= b[1]; j++) {
            delta[1] = j * grid[1];
            for (let i = a[0]; i <= b[0]; i++) {
                delta[0] = i * grid[0];
                Query.fillData(data, block, delta);
            }
        }
    }
}