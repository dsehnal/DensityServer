/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from '../Utils/File'
import * as Data from './DataModel'
import { Coords, Box } from './Transforms'
import * as LA from '../Utils/LinearAlgebra'

function getArray<T>(r: (offset: number) => T, offset: number, count: number, step = 1): T[] {
    let ret:T[] = [];
    for (let i = 0; i < count; i++) {
        ret[i] = r(offset + i * step);
    }
    return ret;
}

export async function readHeader(file: number) {

    const maxDensityCount = 4; 
    const headerBaseSize = 23 * 4;
    const readSize = headerBaseSize + 4 * 4 * maxDensityCount + 32 * maxDensityCount;

    let { buffer: data } = await File.readBuffer(file, 0, readSize);

    let littleEndian = data.readInt32LE(0) === 0x1237;
    let numDensities = littleEndian ? data.readInt32LE(4) : data.readUInt32BE(4);

    if (numDensities > maxDensityCount) {
        throw Error('At most 4 density fields are supported per single file.');
    }

    let readInt = littleEndian ? (o: number) => data.readInt32LE(8 + o * 4) : (o: number) => data.readInt32BE(8 + o * 4); 
    let readFloat = littleEndian ? (o: number) => data.readFloatLE(8 + o * 4) : (o: number) => data.readFloatBE(8 + o * 4);
    let readString = (o: number) => {
        let bytes: number[] = [];
        for (let i = 0; i < 32; i++) bytes.push(data.readUInt8(8 + 4 * o + i));
        return String.fromCharCode.apply(null, bytes).trim();
    }

    let header: Data.Header = {
        numDensities,
        formatId: readInt(0),
        gridSize: getArray(readInt, 1, 3),
        blockSize: readInt(4),
        axisOrder: getArray(readInt, 5, 3),
        extent: getArray(readInt, 8, 3),
        origin: getArray(readFloat, 11, 3),
        spacegroupNumber: readInt(14),
        cellSize: getArray(readFloat, 15, 3),
        cellAngles: getArray(readFloat, 18, 3),
        means: getArray(readFloat, 21, numDensities),
        sigmas: getArray(readFloat, 21 + numDensities, numDensities),
        minimums: getArray(readFloat, 21 + 2 * numDensities, numDensities),
        maximums: getArray(readFloat, 21 + 3 * numDensities, numDensities),
        names: getArray(readString, 21 + 4 * numDensities, numDensities, 8),

        dataByteOffset: headerBaseSize + 4 * 4 * numDensities + 32 * numDensities 
    };

    return header;
}

function createInfo(header: Data.Header): Data.Info {
    let { blockSize, extent, gridSize, origin } = header;

    let spacegroup = Coords.makeSpacegroup(header);

    let grid = Coords.mapIndices(header.axisOrder, gridSize);
    let a = Coords.map(
        v => Math.round(v), 
        Coords.mapIndices(header.axisOrder, Coords.transform(origin, spacegroup.toFrac)));

    return {
        isAsymmetric: header.spacegroupNumber <= 1,
        blockCount: Coords.map(e => Math.ceil(e / blockSize) | 0, extent),
        ...spacegroup,
        grid,
        dataBox: Box.normalize({
            a,
            b: Coords.add(a, extent)
        })
    };
}

export async function open(filename: string) {
    let file = await File.openRead(filename);

    try {
        let header = await readHeader(file);
        let info = createInfo(header);
        return <Data.Context>{ file, header, info }
    } catch (e) {
        File.close(file);
        throw e;
    }
}

export async function readBlock(ctx: Data.Context, coord: number[]) {
    let { box, dimensions, dataOffset } = Box.getBlockMetrics(ctx, coord);
    let count = dimensions[0] * dimensions[1] * dimensions[2];
    let data = File.createFloat32ArrayContext(ctx.header.numDensities * count);
    let values = await File.readFloat32Array(data, ctx.file, dataOffset, ctx.header.numDensities * count);

    return <Data.MultiBlock>{
        coord,
        dimensions,
        box,
        values,
        blockCount: ctx.info.blockCount
    };
}

