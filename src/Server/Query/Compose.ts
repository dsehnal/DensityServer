/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'
import * as Identify from './Identify'
import * as Box from '../Algebra/Box'
import * as Coords from '../Algebra/Coordinate'
import * as File from '../../Common/File'

export default async function readBlock(query: Data.QueryContext, coord: Coords.Grid<'Block'>, blockBox: Box.Fractional): Promise<Data.BlockData> {
    const sampleCount = Box.dimensions(Box.fractionalToGrid(blockBox, query.sampling.dataDomain));
    const size = query.data.header.channels.length * sampleCount[0] * sampleCount[1] * sampleCount[2];
    const buffer = File.createTypedArrayBufferContext(size, query.data.header.valueType);
    const values = await File.readTypedArray(buffer, query.data.file, 0, size, 0);
    return {
        sampleCount,
        values
    };
}

function fillData(query: Data.QueryContext, blockData: Data.BlockData, blockGridBox: Box.Grid<'BlockGrid'>) {
    const { values: source, sampleCount: blockSampleCount } = blockData;

    const tSizeH = query.gridBox.a.domain.sampleCount[0], 
          tSizeHK = query.gridBox.a.domain.sampleCount[0] * query.gridBox.a.domain.sampleCount[1];
    const sSizeH = blockSampleCount[0],
          sSizeHK = blockSampleCount[0] * blockSampleCount[1];

    const offsetTarget = query.gridBox.a[0] + query.gridBox.a[1] * tSizeH + query.gridBox.a[2] * tSizeHK;

    const [maxH, maxK, maxL] = Box.dimensions(blockGridBox);

    for (let channelIndex = 0, _ii = query.data.header.channels.length; channelIndex < _ii; channelIndex++) {
        const target = query.result.values![channelIndex];
        const offsetSource = channelIndex * blockGridBox.a.domain.sampleVolume 
            + blockGridBox.a[0] + blockGridBox.a[1] * sSizeH + blockGridBox.a[2] * sSizeHK;

        for (let l = 0; l < maxL; l++) {
            for (let k = 0; k < maxK; k++) {
                for (let h = 0; h < maxH; h++) {
                    target[offsetTarget + h + k * tSizeH + l * tSizeHK] = source[offsetSource + h + k * sSizeH + l * sSizeHK]
                }
            }
        }
    }
}

function createBlockGridDomain(block: Coords.Grid<'Block'>, grid: Coords.GridDomain<'Data'>, blockSize: number): Coords.GridDomain<'BlockGrid'> {
    const blockBox = Box.fractionalFromBlock(block);
    const origin = blockBox.a;
    const dimensions = Coords.sub(blockBox.b, blockBox.a);
    const sampleCount = Coords.sampleCounts(dimensions, grid.delta, 'ceil');
    return Coords.domain<'BlockGrid'>('BlockGrid', { origin, dimensions, delta: grid.delta, sampleCount });
}

/** Read the block data and fill all the overlaps with the query region. */
async function fillBlock(query: Data.QueryContext, block: Identify.UniqueBlock) {
    const baseBox = Box.fractionalFromBlock(block.coord);
    const blockGridDomain = createBlockGridDomain(block.coord, query.sampling.dataDomain, query.data.header.blockSize);

    const blockData: Data.BlockData = await readBlock(query, block.coord, baseBox);

    for (const offset of block.offsets) {
        const offsetBlockBox = Box.shift(baseBox, offset);
        const dataBox = Box.intersect(offsetBlockBox, query.fractionalBox);
        if (!dataBox) continue;
        const blockGridBox = Box.clampGridToSamples(Box.fractionalRoundToGrid(dataBox, blockGridDomain));
        fillData(query, blockData, blockGridBox);
    }
}

export async function compose(query: Data.QueryContext, blocks: Identify.UniqueBlock[]) {
    for (const block of blocks) {
        await fillBlock(query, block);
    }
}