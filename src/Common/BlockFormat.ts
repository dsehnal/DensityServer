/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from '../Utils/File'

export const enum FormatId { 
    Float32 = 0, 
    // Float64 = 1
    Int8 = 2,
    // Uint8 = 3
    // ...
}

export interface Header {
    /** Format version number  */
    version: number,

    /** Number of density data/channels present in the file */
    numDensities: number,

    /** Determines the data type of the values */
    formatId: FormatId,

    /** The value are stored in blockSize^3 cubes */
    blockSize: number,

    /** Axis order from the slowest to fastest moving, same as in CCP4 */
    axisOrder: number[],

    /** Number of samples along each axis, in axisOrder  */
    samples: number[],

    /** Dimensions in fractional coordinates, in axisOrder */
    dimensions: number[],

    /** Origin in fractional coordinates, in axisOrder */
    origin: number[],

    /** Spacegroup information */
    spacegroupNumber: number,
    cellSize: number[],
    cellAngles: number[],
    
    /** Metadata */
    means: number[],
    sigmas: number[],
    minimums: number[],
    maximums: number[],
    names: string[],

    /** Block data start at this offset */
    dataByteOffset: number
}

export function getElementByteSize(header: Header) {
    if (header.formatId === FormatId.Float32) return 4;
    return 1;
}

function getArray<T>(r: (offset: number) => T, offset: number, count: number, step = 1): T[] {
    const ret:T[] = [];
    for (let i = 0; i < count; i++) {
        ret[i] = r(offset + i * step);
    }
    return ret;
}

export async function readHeader(file: number) {

    const maxDensityCount = 4; 
    const headerBaseSize = 29 * 4;
    const readSize = headerBaseSize + 4 * 4 * maxDensityCount + 32 * maxDensityCount;

    const { buffer: data } = await File.readBuffer(file, 0, readSize);
    
    const readInt = (o: number) => data.readInt32LE(o * 4); 
    const readFloat = (o: number) => data.readFloatLE(o * 4);
    const readDouble = (o: number) => data.readDoubleLE(o * 4);
    const readString = (o: number) => {
        const bytes: number[] = [];
        for (let i = 0; i < 32; i++) bytes.push(data.readUInt8(4 * o + i));
        return String.fromCharCode.apply(null, bytes).trim();
    }
    
    const numDensities = readInt(1);
    if (numDensities > maxDensityCount) {
        throw Error('At most 4 density fields are supported per single file.');
    }

    const header: Header = {
        version: readInt(0),
        numDensities,
        formatId: readInt(2),
        
        blockSize: readInt(3),
        axisOrder: getArray(readInt, 4, 3),
        
        samples: getArray(readInt, 7, 3),
        dimensions: getArray(readDouble, 10, 3, 2),
        origin: getArray(readDouble, 16, 3, 2),

        spacegroupNumber: readInt(22),
        cellSize: getArray(readFloat, 23, 3),
        cellAngles: getArray(readFloat, 26, 3),

        means: getArray(readFloat, 29, numDensities),
        sigmas: getArray(readFloat, 29 + numDensities, numDensities),
        minimums: getArray(readFloat, 29 + 2 * numDensities, numDensities),
        maximums: getArray(readFloat, 29 + 3 * numDensities, numDensities),
        
        names: getArray(readString, 29 + 4 * numDensities, numDensities, 8),

        dataByteOffset: headerBaseSize + 4 * 4 * numDensities + 32 * numDensities
    };

    return header;
}