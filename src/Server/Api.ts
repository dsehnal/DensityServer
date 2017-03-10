/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from '../Common/File'
import execute from './Query/Execute'
import * as Data from './Query/DataModel'
import * as Logger from './Utils/Logger'
import * as DataFormat from '../Common/DataFormat'
import ServerConfig from '../ServerConfig'

export function getOutputFilename(source: string, id: string, { asBinary, box, detail }: Data.QueryParams) {
    function n(s: string) { return (s || '').replace(/[ \n\t]/g, '').toLowerCase() }
    function r(v: number) { return Math.round(10 * v) / 10; }
    const det = Math.min(Math.max(0, detail | 0), ServerConfig.limits.maxOutputSizeInVoxelCountByPrecisionLevel.length - 1);
    const boxInfo = box.kind === 'Cell' 
        ? 'cell'
        : `${box.kind === 'Cartesian' ? 'cartn' : 'frac'}_${r(box.a[0])}_${r(box.a[1])}_${r(box.a[2])}_${r(box.b[0])}_${r(box.b[1])}_${r(box.b[2])}`;
    return `${n(source)}_${n(id)}-${boxInfo}_d${det}.${asBinary ? 'bcif' : 'cif'}`;
}

/** Reads the header and includes information about available detail levels */
export async function getHeaderJson(filename: string | undefined, sourceId: string) {
    Logger.logPlain('Header', sourceId);
    try {
        const header: any = await readHeader(filename, sourceId);
        header.availablePrecisions = ServerConfig.limits.maxOutputSizeInVoxelCountByPrecisionLevel.map((maxVoxels, precision) => ({ precision, maxVoxels }));
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