/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from './file'
import * as Schema from './binary-schema'

export type ValueType = 'float32' | 'int8'

export namespace ValueType {
    export const Float32: ValueType = 'float32';
    export const Int8: ValueType = 'int8';
}

export type ValueArray = Float32Array | Int8Array

export interface Spacegroup {
    number: number,
    size: number[],
    angles: number[],    
    /** Determine if the data should be treated as periodic or not. (e.g. X-ray = periodic, EM = not periodic) */
    isPeriodic: boolean,
}

export interface ValuesInfo {
    mean: number,
    sigma: number,
    min: number,
    max: number
}

export interface Sampling {
    byteOffset: number,

    /** How many values along each axis were collapsed into 1 */
    rate: number,
    valuesInfo: ValuesInfo[],

    /** Number of samples along each axis, in axisOrder  */
    sampleCount: number[]
}

export interface Header {
    /** Format version number  */
    formatVersion: string,

    /** Axis order from the slowest to fastest moving, same as in CCP4 */
    axisOrder: number[],

    /** Origin in fractional coordinates, in axisOrder */
    origin: number[],

    /** Dimensions in fractional coordinates, in axisOrder */
    dimensions: number[],

    spacegroup: Spacegroup,
    channels: string[],    

    /** Determines the data type of the values */
    valueType: ValueType,

    /** The value are stored in blockSize^3 cubes */
    blockSize: number,
    sampling: Sampling[]
}

module _schema {
    const { array, obj, int, bool, float, str } = Schema

    export const schema = obj<Header>([
        ['formatVersion', str],
        ['axisOrder', array(int)],
        ['origin', array(float)],
        ['dimensions', array(float)],
        ['spacegroup', obj<Spacegroup>([
            ['number', int],
            ['size', array(float)],
            ['angles', array(float)],
            ['isPeriodic', bool],
        ])],
        ['channels', array(str)],
        ['valueType', str],
        ['blockSize', int],
        ['sampling', array(obj<Sampling>([
            ['byteOffset', float],
            ['rate', int],
            ['valuesInfo', array(obj<ValuesInfo>([
                ['mean', float],
                ['sigma', float],
                ['min', float],
                ['max', float]
            ]))],            
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