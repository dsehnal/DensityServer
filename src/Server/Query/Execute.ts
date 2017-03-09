/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as DataFormat from '../../Common/DataFormat'
import * as File from '../../Common/File'
import * as Data from './DataModel'
import * as Coords from '../Algebra/Coordinate'
import * as Box from '../Algebra/Box'
import * as CIF from '../../lib/CIFTools'
import * as Logger from '../Utils/Logger'
import { State } from '../State'
import ServerConfig from '../../ServerConfig'

import identify from './Identify'
import compose from './Compose'
import encode from './Encode'

function getTime() {
    let t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}

function generateUUID() {
    var d = getTime();    
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

export function blockDomain(domain: Coords.GridDomain<'Data'>, blockSize: number): Coords.GridDomain<'Block'> {
    const delta = Coords.fractional(blockSize * domain.delta[0], blockSize * domain.delta[1], blockSize * domain.delta[2]);
    return Coords.domain<'Block'>('Block', {
        origin: domain.origin,
        dimensions: domain.dimensions,
        delta,
        sampleCount: Coords.sampleCounts(domain.dimensions, delta)
    });
}

function createSampling(header: DataFormat.Header, index: number, dataOffset: number): Data.Sampling {
    const sampling = header.sampling[index];
    const dataDomain = Coords.domain<'Data'>('Data', {
        origin: Coords.fractional(header.origin[0], header.origin[1], header.origin[2]),
        dimensions: Coords.fractional(header.dimensions[0], header.dimensions[1], header.dimensions[2]),
        delta: Coords.fractional(
            header.dimensions[0] / sampling.sampleCount[0],
            header.dimensions[1] / sampling.sampleCount[1],
            header.dimensions[2] / sampling.sampleCount[2]),
        sampleCount: sampling.sampleCount
    });
    return {
        index,
        rate: sampling.rate, 
        byteOffset: sampling.byteOffset + dataOffset,
        dataDomain,
        blockDomain: blockDomain(dataDomain, header.blockSize)
    }
}

async function createDataContext(file: number): Promise<Data.DataContext> {
    const { header, dataOffset } = await DataFormat.readHeader(file);

    const origin = Coords.fractional(header.origin[0], header.origin[1], header.origin[2]);
    const dimensions = Coords.fractional(header.dimensions[0], header.dimensions[1], header.dimensions[2]);

    return {
        file,
        header,
        spacegroup: Coords.spacegroup(header.spacegroup),
        dataBox: { a: origin, b: Coords.add(origin, dimensions) },
        sampling: header.sampling.map((s, i) => createSampling(header, i, dataOffset))
    }
}

function createQuerySampling(data: Data.DataContext, sampling: Data.Sampling, queryBox: Box.Fractional): Data.QuerySamplingInfo {
    const fractionalBox = Box.gridToFractional(Box.fractionalToGrid(queryBox, sampling.dataDomain));
    const blocks = identify(data, sampling, fractionalBox);
    let ret = {
        sampling,
        fractionalBox,
        gridDomain: Box.fractionalToDomain<'Query'>(fractionalBox, 'Query', sampling.dataDomain.delta),
        blocks
    };
    return ret;
}

function pickSampling(data: Data.DataContext, queryBox: Box.Fractional, forcedLevel: number): Data.QuerySamplingInfo {    
    if (forcedLevel > 0) {
        return createQuerySampling(data, data.sampling[Math.min(data.sampling.length, forcedLevel) - 1], queryBox);
    }
    
    for (const s of data.sampling) {
        const gridBox = Box.fractionalToGrid(queryBox, s.dataDomain);
        const approxCompressedSize = Box.volume(gridBox) / 4;
        if (approxCompressedSize <= ServerConfig.limits.maxDesiredOutputSizeInBytes) {
            const sampling = createQuerySampling(data, s, queryBox);
            if (sampling.blocks.length <= ServerConfig.limits.maxRequestBlockCount) {
                return sampling;
            }
        }
    }

    return createQuerySampling(data, data.sampling[data.sampling.length - 1], queryBox);
}

function emptyQueryContext(data: Data.DataContext, params: Data.QueryParams, guid: string, serialNumber: number): Data.QueryContext {
    console.log('empty');
    const zero = Coords.fractional(0,0,0);
    const fractionalBox = { a: zero, b: zero };
    const sampling = data.sampling[data.sampling.length - 1];
    return {
        guid,
        serialNumber,
        data,
        params,
        samplingInfo: { 
            sampling, 
            fractionalBox,
            gridDomain: Box.fractionalToDomain<'Query'>(fractionalBox, 'Query', sampling.dataDomain.delta),
            blocks: []
        },
        result: { error: void 0, isEmpty: true } as any
    }
}

function getQueryBox(data: Data.DataContext, queryBox: Data.QueryParamsBox) {
    switch (queryBox.kind) {
        case 'Cartesian': return Box.fractionalBoxReorderAxes(Box.cartesianToFractional(queryBox, data.spacegroup), data.header.axisOrder);
        case 'Fractional': return Box.fractionalBoxReorderAxes(queryBox, data.header.axisOrder);            
        default: return data.dataBox;
    }
}

function createQueryContext(data: Data.DataContext, params: Data.QueryParams, guid: string, serialNumber: number): Data.QueryContext {
    const inputQueryBox = getQueryBox(data, params.box);
    let queryBox;
    if (!data.header.spacegroup.isPeriodic) {
        if (!Box.areIntersecting(data.dataBox, inputQueryBox)) {
            return emptyQueryContext(data, params, guid, serialNumber);
        }
        queryBox = Box.intersect(data.dataBox, inputQueryBox)!;
    } else {
        queryBox = inputQueryBox;
    }

    if (Box.dimensions(queryBox).some(d => isNaN(d) || d > ServerConfig.limits.maxFractionalBoxDimension)) {
        throw `The query box is too big.`;
    }

    const samplingInfo = pickSampling(data, queryBox, params.forcedSamplingLevel !== void 0 ? params.forcedSamplingLevel : 0);

    if (samplingInfo.blocks.length === 0) return emptyQueryContext(data, params, guid, serialNumber);

    return {
        guid,
        serialNumber,
        data,
        params,
        samplingInfo,
        result: { isEmpty: false }
    }
}

function allocateResult(query: Data.QueryContext) {
    const size = query.samplingInfo.gridDomain.sampleVolume;
    const numChannels = query.data.header.channels.length;
    query.result.values = [];
    for (let i = 0; i < numChannels; i++) {
        query.result.values.push(DataFormat.createValueArray(query.data.header.valueType, size));
    }
}

async function _execute(file: number, params: Data.QueryParams, guid: string, serialNumber: number, outputProvider: () => (CIF.OutputStream & { end: () => void })) {
    // Step 1a: Create data context
    const data = await createDataContext(file);

    let output: any = void 0;
    let query;

    try {
        // Step 1b: Create query context
        query = createQueryContext(data, params, guid, serialNumber);

        if (!query.result.isEmpty) {
            // Step 3a: Allocate space for result data
            allocateResult(query);
            // Step 3b: Compose the result data
            await compose(query);
        }
        
        // Step 4: Encode the result
        output = outputProvider();
        encode(query, output);
        output.end();
    } catch (e) {
        if (!query) query = emptyQueryContext(data, params, guid, serialNumber);
        query.result.error = `${e}`;
        query.result.isEmpty = true;
        query.result.values = void 0;
        try {
            if (!output) output = outputProvider();
            encode(query, output);
        } catch (f) {
            throw f;
        }
        throw e;
    } finally {
        if (output) output.end();
    }
}

function roundCoord(c: number) {
    return Math.round(100000 * c) / 100000;
}

function queryBoxToString(queryBox: Data.QueryParamsBox) {
    switch (queryBox.kind) {
        case 'Cartesian':
        case 'Fractional':
            const { a, b } = queryBox;
            const r = roundCoord;
            return `box-type=${queryBox.kind},box-a=(${r(a[0])},${r(a[1])},${r(a[2])}),box-b=(${r(b[0])},${r(b[1])},${r(b[2])})`;
        default:
            return queryBox.kind;
    }
}

export async function execute(params: Data.QueryParams, outputProvider: () => Data.QueryOutputStream) {
    const start = getTime();
    State.pendingQueries++;

    const guid = generateUUID();
    const serialNumber = State.querySerial++;
        
    Logger.log(guid, 'Info', `id=${params.sourceId},encoding=${params.asBinary ? 'binary' : 'text'},${queryBoxToString(params.box)}`);
    
    let sourceFile: number | undefined = void 0;
    try {
        sourceFile = await File.openRead(params.sourceFilename);
        await _execute(sourceFile, params, guid, serialNumber, outputProvider);     
        return true;
    } catch (e) {
        Logger.error(guid, e);
        return false;
    } finally {
        File.close(sourceFile);
        Logger.log(guid, 'Time', `${Math.round(getTime() - start)}ms`);
        State.pendingQueries--;
    }
}