// /*
//  * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
//  */

import * as Data from '../Query/DataModel'
import * as Coords from '../Algebra/Coordinate'
import * as Box from '../Algebra/Box'
import * as File from '../../Common/File'

export default async function readBlock(query: Data.QueryContext, coord: Coords.Grid<'Block'>, blockBox: Box.Fractional): Promise<Data.BlockData> {
    const sampleCount = Box.dimensions(Box.fractionalToGrid(blockBox, query.sampling.dataDomain));
    const size = query.data.header.channels.length * sampleCount[0] * sampleCount[1] * sampleCount[2];
    const buffer = File.createTypedArrayBufferContext(size, query.data.header.valueType);
    const values = await File.readTypedArray(buffer, query.data.file, 0, size, 0);
    return {
        coord,
        sampleCount,
        values
    };
}