/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from '../Utils/File'
import * as Schema from '../Utils/BinarySchema'

export const enum ValueType { 
    Float32 = 0, 
    // Float64 = 1
    Int8 = 2,
    // Uint8 = 3
    // ...
}

export interface Spacegroup {
    number: number,
    size: number[],
    angles: number[],    
    /** Determine if the data should be treated as periodic or not. (e.g. X-ray = periodic, EM = not periodic) */
    isPeriodic: boolean,
}

export interface Channel {
    name: string,
    mean: number,
    sigma: number,
    min: number,
    max: number
}

export interface Sampling {
    byteOffset: number,

    /** Number of samples along each axis, in axisOrder  */
    samples: number[]
}

export interface Header {
    /** Format version number  */
    version: string,

    /** Determines the data type of the values */
    valueType: ValueType,

    /** The value are stored in blockSize^3 cubes */
    blockSize: number,

    /** Axis order from the slowest to fastest moving, same as in CCP4 */
    axisOrder: number[],

    /** Dimensions in fractional coordinates, in axisOrder */
    dimensions: number[],

    /** Origin in fractional coordinates, in axisOrder */
    origin: number[],

    spacegroup: Spacegroup,
    channels: Channel[],    
    sampling: Sampling[]
}

module _schema {
    const { array, obj, int, bool, float, str } = Schema

    export const schema = obj<Header>([
        ['version', str],
        ['valueType', int],
        ['blockSize', int],
        ['axisOrder', array(int)],
        ['dimensions', array(float)],
        ['origin', array(float)],
        ['spacegroup', obj<Spacegroup>([
            ['number', int],
            ['size', float],
            ['angles', float],
            ['isPeriodic', bool],
        ])],
        ['channels', array(obj<Channel>([
            ['name', str],
            ['mean', float],
            ['sigma', float],
            ['min', float],
            ['max', float],
        ]))],
        ['sampling', array(obj<Sampling>([
            ['byteOffset', float],
            ['samples', array(int)]
        ]))]
    ]);
}

const headerSchema = _schema.schema;

export function getValueByteSize(header: Header) {
    if (header.valueType === ValueType.Float32) return 4;
    return 1;
}

export async function headerByteSize(header: Header) {
    return 4 + Schema.encode(headerSchema, header).byteLength;
}

export async function writeHeader(file: File.WriteContext, header: Header) {
    const encoded = Schema.encode(headerSchema, header);
    await File.writeInt(file, encoded.byteLength);
    await File.writeBuffer(file.file, 4, encoded);
}

export async function readHeader(file: number): Promise<{ header: Header, dataOffset: number }> {
    let { buffer } = await File.readBuffer(file, 0, 4 * 4096);
    const headerSize = buffer.readInt32LE(0);

    if (headerSize > buffer.byteLength - 4) {
        buffer = (await File.readBuffer(file, 0, headerSize + 4)).buffer;
    }

    const header = Schema.decode<Header>(headerSchema, buffer, 4);
    return { header, dataOffset: headerSize + 4 };

    //Schema.decode<Header>(..)

    // const maxDensityCount = 4; 
    // const headerBaseSize = 29 * 4;
    // const readSize = headerBaseSize + 4 * 4 * maxDensityCount + 32 * maxDensityCount;

    // const { buffer: data } = await File.readBuffer(file, 0, readSize);
    
    // const readInt = (o: number) => data.readInt32LE(o * 4); 
    // const readFloat = (o: number) => data.readFloatLE(o * 4);
    // const readDouble = (o: number) => data.readDoubleLE(o * 4);
    // const readString = (o: number) => {
    //     const bytes: number[] = [];
    //     for (let i = 0; i < 32; i++) bytes.push(data.readUInt8(4 * o + i));
    //     return String.fromCharCode.apply(null, bytes).trim();
    // }
    
    // const numDensities = readInt(1);
    // const numSamplings = readInt(2);

    // if (numDensities > maxDensityCount) {
    //     throw Error('At most 4 density channels are supported per single file.');
    // }

    // const header: Header = {
    //     version: readInt(0),
    //     numDensities,
    //     formatId: readInt(2),
        
    //     blockSize: readInt(3),
    //     axisOrder: getArray(readInt, 4, 3),
        
    //     dimensions: getArray(readDouble, 10, 3, 2),
    //     origin: getArray(readDouble, 16, 3, 2),

    //     spacegroupNumber: readInt(22),
    //     cellSize: getArray(readFloat, 23, 3),
    //     cellAngles: getArray(readFloat, 26, 3),

    //     means: getArray(readFloat, 29, numDensities),
    //     sigmas: getArray(readFloat, 29 + numDensities, numDensities),
    //     minimums: getArray(readFloat, 29 + 2 * numDensities, numDensities),
    //     maximums: getArray(readFloat, 29 + 3 * numDensities, numDensities),
        
    //     names: getArray(readString, 29 + 4 * numDensities, numDensities, 8),

    //     sampling: 0 as any,

    //     dataByteOffset: headerBaseSize + 4 * 4 * numDensities + 32 * numDensities
    // };

    // return header;
}


// function getArray<T>(r: (offset: number) => T, offset: number, count: number, step = 1): T[] {
//     const ret:T[] = [];
//     for (let i = 0; i < count; i++) {
//         ret[i] = r(offset + i * step);
//     }
//     return ret;
// }
