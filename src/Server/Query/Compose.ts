/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'
import * as Identify from './Identify'
import * as Box from '../Algebra/Box'
import * as Coords from '../Algebra/Coordinate'
import readBlock from '../IO/BlockReader'

function fillChannel(query: Data.QueryContext, channelIndex: number, blockData: Data.BlockData, blockGridBox: Box.Grid<'BlockGrid'>, queryGridBox: Box.Grid<'Query'>) {

}

function fillData(query: Data.QueryContext, blockData: Data.BlockData, blockGridBox: Box.Grid<'BlockGrid'>, queryGridBox: Box.Grid<'Query'>) {
    for (let i = 0, _ii = query.data.header.channels.length; i < _ii; i++) {
        fillChannel(query, i, blockData, blockGridBox, queryGridBox);
    }
}

function createBlockGridDomain(block: Coords.Grid<'Block'>, grid: Coords.GridDomain<'Data'>, blockSize: number): Coords.GridDomain<'BlockGrid'> {
    const blockBox = Box.fractionalFromBlock(block);
    const origin = blockBox.a;
    const dimensions = Coords.sub(blockBox.b, blockBox.a);
    const sampleCount = Coords.sampleCounts(dimensions, grid.delta, 'round');
    return Coords.domain<'BlockGrid'>('BlockGrid', { origin, dimensions, delta: grid.delta, sampleCount });
}

/** Read the block data and fill all the overlaps with the query region. */
async function fillBlock(query: Data.QueryContext, block: Identify.UniqueBlock) {
    const baseBox = Box.fractionalFromBlock(block.coord);
    const blockGridDomain = createBlockGridDomain(block.coord, query.sampling.dataDomain, query.data.header.blockSize);

    const blockData: Data.BlockData = await readBlock(query, block.coord, baseBox);

    for (const offset of block.offsets) {
        const offsetBlockBox = Box.shift(baseBox, offset);
        const dataBox = Box.intersect(offsetBlockBox, query.box);
        if (!dataBox) continue;
        const blockGridBox = Box.clampGridToSamples(Box.fractionalRoundToGrid(dataBox, blockGridDomain));
        const queryGridBox = Box.clampGridToSamples(Box.fractionalRoundToGrid(dataBox, query.domain));
        fillData(query, blockData, blockGridBox, queryGridBox);
    }
}

export async function compose(query: Data.QueryContext, blocks: Identify.UniqueBlock[]) {
    for (const block of blocks) {
        await fillBlock(query, block);
    }
}