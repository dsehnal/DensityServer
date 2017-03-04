/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

// TODO: create context, analyze query limits, which sampling to choose etc.

import * as DataFormat from '../../Common/DataFormat'
import * as Data from './DataModel'
import * as Coords from '../Algebra/Coordinate'
import * as Box from '../Algebra/Box'
import * as CIF from '../../lib/CIFTools'

import identify from './Identify'
import compose from './Compose'
import encode from './Encode'


export function blockDomain(domain: Coords.GridDomain<'Data'>, blockSize: number): Coords.GridDomain<'Block'> {
    const delta = Coords.fractional([ blockSize * domain.delta[0], blockSize * domain.delta[1], blockSize * domain.delta[2] ]);
    return Coords.domain<'Block'>('Block', {
        origin: domain.origin,
        dimensions: domain.dimensions,
        delta,
        sampleCount: Coords.sampleCounts(domain.origin, delta, 'ceil')
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
        sampling: header.sampling.map(s => createSampling(header, s, dataOffset))
    }
}

function getQueryGridBox(sampling: Data.Sampling, fractional: Box.Fractional): Box.Grid<'Query'> {
    const domain = Box.fractionalToDomain<'Query'>(fractional, 'Query', sampling.dataDomain.delta)
    
}


function pickSampling(data: Data.DataContext, queryBox: Box.Fractional) {
    return data.sampling[0];
}

function createQueryContext(data: Data.DataContext, params: Data.QueryParams): Data.QueryContext {
    const queryBox = params.box.a.kind === Coords.Space.Fractional 
        ? params.box as Box.Fractional
        : Box.cartesianToFractional(params.box as Box.Cartesian, data.spacegroup, data.header.axisOrder);

    const sampling = pickSampling(data, queryBox);
    // snap the query box to the sampling grid:
    const fractionalBox = Box.gridToFractional(Box.fractionalToGrid(queryBox, sampling.dataDomain));
    const gridBox = getQueryGridBox(sampling, fractionalBox);

    return {
        data,
        params,
        sampling,
        fractionalBox,
        gridBox,
        result: { error: void 0, isEmpty: true } as any
    }
}

function validateQueryContext(query: Data.QueryContext) {
    // TODO
}

function allocateResult(query: Data.QueryContext) {

}

async function _execute(file: number, params: Data.QueryParams, outputProvider: () => CIF.OutputStream) {
    // Step 1a: Create data context
    const data = await createDataContext(file);
    // Step 1b: Create query context
    const query = createQueryContext(data, params);

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
            compose(query, blocks);
        }

        // Step 4: Encode the result
        encode(query, outputProvider());
    } catch (e) {
        query.result.error = `${e}`;
        query.result.isEmpty = true;
        query.result.values = void 0;
    }
}

/**
 * Execute the query.
 * 
 * Closing the file and the output provider is the responsibility of the caller!
 */
export default async function execute(file: number, params: Data.QueryParams, outputProvider: () => CIF.OutputStream) {
    try {
        await _execute(file, params, outputProvider)
    } catch (e) {

    }
}