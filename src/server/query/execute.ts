/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as DataFormat from '../../common/data-format'
import * as File from '../../common/file'
import * as Data from './data-model'
import * as Coords from '../algebra/coordinate'
import * as Box from '../algebra/box'
import * as CIF from '../../lib/cif-tools'
import * as Logger from '../utils/logger'
import { State } from '../state'
import ServerConfig from '../../server-config'

import identify from './identify'
import compose from './compose'
import encode from './encode'

export default async function execute(params: Data.QueryParams, outputProvider: () => Data.QueryOutputStream) {
    const start = getTime();
    State.pendingQueries++;

    const guid = generateUUID();
    params.detail = Math.min(Math.max(0, params.detail | 0), ServerConfig.limits.maxOutputSizeInVoxelCountByPrecisionLevel.length - 1);
    Logger.log(guid, 'Info', `id=${params.sourceId},encoding=${params.asBinary ? 'binary' : 'text'},detail=${params.detail},${queryBoxToString(params.box)}`);

    let sourceFile: number | undefined = void 0;
    try {
        sourceFile = await File.openRead(params.sourceFilename);
        await _execute(sourceFile, params, guid, outputProvider);
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

function getTime() {
    let t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}

function generateUUID() {
    let d = getTime();
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function blockDomain(domain: Coords.GridDomain<'Data'>, blockSize: number): Coords.GridDomain<'Block'> {
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
    const fractionalBox = Box.gridToFractional(Box.expandGridBox(Box.fractionalToGrid(queryBox, sampling.dataDomain), 1));
    const blocks = identify(data, sampling, fractionalBox);
    let ret = {
        sampling,
        fractionalBox,
        gridDomain: Box.fractionalToDomain<'Query'>(fractionalBox, 'Query', sampling.dataDomain.delta),
        blocks
    };
    return ret;
}

function pickSampling(data: Data.DataContext, queryBox: Box.Fractional, forcedLevel: number, precision: number): Data.QuerySamplingInfo {
    if (forcedLevel > 0) {
        return createQuerySampling(data, data.sampling[Math.min(data.sampling.length, forcedLevel) - 1], queryBox);
    }

    const sizeLimit = ServerConfig.limits.maxOutputSizeInVoxelCountByPrecisionLevel[precision] || (2 * 1024 * 1024);
    for (const s of data.sampling) {
        const gridBox = Box.fractionalToGrid(queryBox, s.dataDomain);
        const approxSize = Box.volume(gridBox);
        if (approxSize <= sizeLimit) {
            const sampling = createQuerySampling(data, s, queryBox);
            if (sampling.blocks.length <= ServerConfig.limits.maxRequestBlockCount) {
                return sampling;
            }
        }
    }

    return createQuerySampling(data, data.sampling[data.sampling.length - 1], queryBox);
}

function emptyQueryContext(data: Data.DataContext, params: Data.QueryParams, guid: string): Data.QueryContext {
    return { kind: 'Empty', guid, params, data }
}

function getQueryBox(data: Data.DataContext, queryBox: Data.QueryParamsBox) {
    switch (queryBox.kind) {
        case 'Cartesian': return Box.fractionalBoxReorderAxes(Box.cartesianToFractional(queryBox, data.spacegroup), data.header.axisOrder);
        case 'Fractional': return Box.fractionalBoxReorderAxes(queryBox, data.header.axisOrder);
        default: return data.dataBox;
    }
}

function allocateValues(domain: Coords.GridDomain<'Query'>, numChannels: number, valueType: DataFormat.ValueType) {
    const values = [];
    for (let i = 0; i < numChannels; i++) {
        values[values.length] = DataFormat.createValueArray(valueType, domain.sampleVolume);
    }
    return values;
}

function createQueryContext(data: Data.DataContext, params: Data.QueryParams, guid: string): Data.QueryContext {
    const inputQueryBox = getQueryBox(data, params.box);
    let queryBox;
    if (!data.header.spacegroup.isPeriodic) {
        if (!Box.areIntersecting(data.dataBox, inputQueryBox)) {
            return emptyQueryContext(data, params, guid);
        }
        queryBox = Box.intersect(data.dataBox, inputQueryBox)!;
    } else {
        queryBox = inputQueryBox;
    }

    const dimensions = Box.dimensions(queryBox);
    if (dimensions.some(d => isNaN(d))) {
        throw `The query box is not defined.`;
    }

    if (dimensions[0] * dimensions[1] * dimensions[2] > ServerConfig.limits.maxFractionalBoxVolume) {
        throw `The query box volume is too big.`;
    }

    const samplingInfo = pickSampling(data, queryBox, params.forcedSamplingLevel !== void 0 ? params.forcedSamplingLevel : 0, params.detail);

    if (samplingInfo.blocks.length === 0) return emptyQueryContext(data, params, guid);

    return {
        kind: 'Data',
        guid,
        data,
        params,
        samplingInfo,
        values: allocateValues(samplingInfo.gridDomain, data.header.channels.length, data.header.valueType)
    }
}


async function _execute(file: number, params: Data.QueryParams, guid: string, outputProvider: () => (CIF.OutputStream & { end: () => void })) {
    let output: any = void 0;
    try {
        // Step 1a: Create data context
        const data = await createDataContext(file);

        // Step 1b: Create query context
        const query = createQueryContext(data, params, guid);

        if (query.kind === 'Data') {
            // Step 3b: Compose the result data
            await compose(query);
        }

        // Step 4: Encode the result
        output = outputProvider();
        encode(query, output);
        output.end();
    } catch (e) {
        const query: Data.QueryContext = { kind: 'Error', guid, params, message: `${e}` }
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
            return `box-type=${queryBox.kind}`;
    }
}