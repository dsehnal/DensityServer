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

import identify from './Identify'
import compose from './Compose'
import encode from './Encode'

function getTime() {
    let t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}

function generateUUID() {
    var d = new Date().getTime() + getTime();    
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

export function blockDomain(domain: Coords.GridDomain<'Data'>, blockSize: number): Coords.GridDomain<'Block'> {
    const delta = Coords.fractional([ blockSize * domain.delta[0], blockSize * domain.delta[1], blockSize * domain.delta[2] ]);
    return Coords.domain<'Block'>('Block', {
        origin: domain.origin,
        dimensions: domain.dimensions,
        delta,
        sampleCount: Coords.sampleCounts(domain.dimensions, delta, 'ceil')
    });
}

function createSampling(header: DataFormat.Header, index: number, dataOffset: number): Data.Sampling {
    const sampling = header.sampling[index];
    const dataDomain = Coords.domain<'Data'>('Data', {
        origin: Coords.fractional(header.origin),
        dimensions: Coords.fractional(header.dimensions),
        delta: Coords.fractional([
            header.dimensions[0] / (sampling.sampleCount[0] - 1),
            header.dimensions[1] / (sampling.sampleCount[1] - 1),
            header.dimensions[2] / (sampling.sampleCount[2] - 1)
        ]),
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

    return {
        file,
        header,
        spacegroup: Coords.spacegroup(header.spacegroup),
        dataBox: { a: Coords.fractional(header.origin), b: Coords.add(Coords.fractional(header.origin), Coords.fractional(header.dimensions)) },
        sampling: header.sampling.map((s, i) => createSampling(header, i, dataOffset))
    }
}

function pickSampling(data: Data.DataContext, queryBox: Box.Fractional) {
    return data.sampling[0];
}

function createQueryContext(data: Data.DataContext, params: Data.QueryParams, guid: string, serialNumber: number,): Data.QueryContext {
    const queryBox = params.box.a.kind === Coords.Space.Fractional 
        ? params.box as Box.Fractional
        : Box.cartesianToFractional(params.box as Box.Cartesian, data.spacegroup, data.header.axisOrder);

    const sampling = pickSampling(data, queryBox);
    // snap the query box to the sampling grid:
    const fractionalBox = Box.gridToFractional(Box.fractionalToGrid(queryBox, sampling.dataDomain));

    console.log({ gridDomain: Box.fractionalToDomain<'Query'>(fractionalBox, 'Query', sampling.dataDomain.delta) });

    return {
        guid,
        serialNumber,
        data,
        params,
        sampling,
        fractionalBox,
        gridDomain: Box.fractionalToDomain<'Query'>(fractionalBox, 'Query', sampling.dataDomain.delta),
        result: { error: void 0, isEmpty: true } as any
    }
}

function validateQueryContext(query: Data.QueryContext) {
    // TODO
}

function allocateResult(query: Data.QueryContext) {
    const size = query.gridDomain.sampleVolume;
    const numChannels = query.data.header.channels.length;
    query.result.values = [];
    for (let i = 0; i < numChannels; i++) {
        query.result.values.push(DataFormat.createValueArray(query.data.header.valueType, size));
    }
}

async function _execute(file: number, params: Data.QueryParams, guid: string, serialNumber: number, outputProvider: () => (CIF.OutputStream & { end: () => void })) {
    // Step 1a: Create data context
    const data = await createDataContext(file);
    // Step 1b: Create query context
    const query = createQueryContext(data, params, guid, serialNumber);

    let output: any = void 0;

    try {
        // Step 2a: Validate query context
        validateQueryContext(query);

        // Step 2b: Identify blocks that overlap with the query data.
        const blocks = identify(query);

        if (blocks.length === 0) {
            query.result.isEmpty = true;
        } else {
            query.result.isEmpty = false;

            // Step 3a: Allocate space for result data
            allocateResult(query);

            // Step 3b: Compose the result data
            await compose(query, blocks);
        }

        // Step 4: Encode the result
        output = outputProvider();
        encode(query, output);
    } catch (e) {
        query.result.error = `${e}`;
        query.result.isEmpty = true;
        query.result.values = void 0;
        try {
            if (!output) output = outputProvider();
            encode(query, output);
        } catch (e) {
            throw e;
        }
    } finally {
        if (output) output.end();
    }
}

export async function execute(params: Data.QueryParams, outputProvider: () => (CIF.OutputStream & { end: () => void })) {
    const start = getTime();
    State.pendingQueries++;

    const guid = generateUUID();
    const serialNumber = State.querySerial++;

    const { a, b } = params.box;
    Logger.log(`[GUID] ${guid}`, serialNumber);
    Logger.log(`[Id] ${params.sourceId}`, serialNumber);
    Logger.log(`[Box] ${a.kind === Coords.Space.Cartesian ? 'cart' : 'frac'} [${a[0]},${a[1]},${a[2]}] [${b[0]},${b[1]},${b[2]}]`, serialNumber);
    Logger.log(`[Encoding] ${params.asBinary ? 'bcif' : 'cif'}`, serialNumber);

    let sourceFile: number | undefined = void 0;
    try {
        sourceFile = await File.openRead(params.sourceFilename);
        await _execute(sourceFile, params, guid, serialNumber, outputProvider);
        Logger.log(`[OK]`, serialNumber); 
        return true;
    } catch (e) {
        Logger.log(`[Error] ${e}`, serialNumber); 
    } finally {
        File.tryClose(sourceFile);
        State.pendingQueries--;
        const time = getTime() - start;
        Logger.log(`[Time] ${Math.round(time)}ms`, serialNumber);
        return false;
    }
}