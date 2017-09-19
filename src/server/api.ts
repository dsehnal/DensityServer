/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from '../common/file'
import execute from './query/execute'
import * as Data from './query/data-model'
import * as Logger from './utils/logger'
import * as DataFormat from '../common/data-format'
import ServerConfig from '../server-config'

export function getOutputFilename(source: string, id: string, { asBinary, box, detail, forcedSamplingLevel }: Data.QueryParams) {
    function n(s: string) { return (s || '').replace(/[ \n\t]/g, '').toLowerCase() }
    function r(v: number) { return Math.round(10 * v) / 10; }
    const det = forcedSamplingLevel !== void 0
        ? `l${forcedSamplingLevel}`
        : `d${Math.min(Math.max(0, detail | 0), ServerConfig.limits.maxOutputSizeInVoxelCountByPrecisionLevel.length - 1)}`;
    const boxInfo = box.kind === 'Cell' 
        ? 'cell'
        : `${box.kind === 'Cartesian' ? 'cartn' : 'frac'}_${r(box.a[0])}_${r(box.a[1])}_${r(box.a[2])}_${r(box.b[0])}_${r(box.b[1])}_${r(box.b[2])}`;
    return `${n(source)}_${n(id)}-${boxInfo}_${det}.${asBinary ? 'bcif' : 'cif'}`;
}

/** Reads the header and includes information about available detail levels */
export async function getHeaderJson(filename: string | undefined, sourceId: string) {
    Logger.logPlain('Header', sourceId);
    try {
        if (!filename || !File.exists(filename)) {
            Logger.errorPlain(`Header ${sourceId}`, 'File not found.');
            return void 0;
        }
        const header = { ...await readHeader(filename, sourceId) };
        const { sampleCount } = header!.sampling[0];
        const maxVoxelCount = sampleCount[0] * sampleCount[1] * sampleCount[2];
        const precisions = ServerConfig.limits.maxOutputSizeInVoxelCountByPrecisionLevel
            .map((maxVoxels, precision) => ({ precision, maxVoxels }));
        const availablePrecisions = [];
        for (const p of precisions) {
            availablePrecisions.push(p);
            if (p.maxVoxels > maxVoxelCount) break;
        }       
        (header as any).availablePrecisions = availablePrecisions;
        (header as any).isAvailable = true;
        return JSON.stringify(header, null, 2);
    } catch (e) {
        Logger.errorPlain(`Header ${sourceId}`, e);
        return void 0;
    } 
}

export async function queryBox(params: Data.QueryParams, outputProvider: () => Data.QueryOutputStream) {    
    return await execute(params, outputProvider);        
}

async function readHeader(filename: string | undefined, sourceId: string) {
    let file: number | undefined = void 0;
    try {
        if (!filename) return void 0;
        file = await File.openRead(filename);
        const header = await DataFormat.readHeader(file);
        return header.header;
    } catch (e) {
        Logger.errorPlain(`Info ${sourceId}`, e);
        return void 0;
    } finally {
        File.close(file);
    }
}