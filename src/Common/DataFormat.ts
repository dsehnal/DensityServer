/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from './File'
import * as Schema from './BinarySchema'

export const enum ValueType { 
    Float32 = 0, 
    // Float64 = 1
    Int8 = 2,
    // Uint8 = 3
    // ...
}

export type ValueArray = Float32Array | Int8Array

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

    /** How many values along each axis were collapsed into 1 */
    rate: number,

    /** Number of samples along each axis, in axisOrder  */
    sampleCount: number[]
}

export interface Header {
    /** Format version number  */
    formatVersion: string,

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
        ['formatVersion', str],
        ['valueType', int],
        ['blockSize', int],
        ['axisOrder', array(int)],
        ['dimensions', array(float)],
        ['origin', array(float)],
        ['spacegroup', obj<Spacegroup>([
            ['number', int],
            ['size', array(float)],
            ['angles', array(float)],
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
            ['rate', int],
            ['sampleCount', array(int)]
        ]))]
    ]);
}

const headerSchema = _schema.schema;

export function getValueByteSize(type: ValueType) {
    if (type === ValueType.Float32) return 4;
    return 1;
}

export function createValueArray(type: ValueType, size: number) {
    if (type === ValueType.Float32) {
        return new Float32Array(new ArrayBuffer(4 * size));
    }
    return new Int8Array(new ArrayBuffer(size));
}

export function encodeHeader(header: Header) {
    return Schema.encode(headerSchema, header);
}

export async function readHeader(file: number): Promise<{ header: Header, dataOffset: number }> {
    let { buffer } = await File.readBuffer(file, 0, 4 * 4096);
    const headerSize = buffer.readInt32LE(0);

    if (headerSize > buffer.byteLength - 4) {
        buffer = (await File.readBuffer(file, 0, headerSize + 4)).buffer;
    }

    const header = Schema.decode<Header>(headerSchema, buffer, 4);
    return { header, dataOffset: headerSize + 4 };
}