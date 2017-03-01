/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as File from '../Utils/File'
import * as BlockFormat from '../Common/BlockFormat'

export const enum Mode { Int8 = 0, Float32 = 2 }

export interface Header {
    name: string,
    mode: Mode,
    grid: number[], // grid is converted to the axis order!!
    axisOrder: number[],
    extent: number[],
    origin: number[],
    spacegroupNumber: number,
    cellSize: number[],
    cellAngles: number[],
    mean: number,
    sigma: number,
    min: number,
    max: number,
    littleEndian: boolean,
    dataOffset: number 
}

/** Represents a circular buffer for 2 * blockSize layers */
export interface DataLayer {   
    buffer: File.TypedArrayBufferContext,

    blockSize: number,

    /** Index of the first slice that is available */
    startSlice: number,

    /** Number of slices available in the buffer */
    endSlice: number,

    values: File.ValueArray,
    valuesOffset: number,

    readCount: number,
    readHeight: number,

    /** Have all the input slice been read? */
    isFinished: boolean
}

export interface Data {
    header: Header,
    file: number,
    layer: DataLayer,
    numLayers: number
}

export function getValueType(header: Header) {
    if (header.mode === Mode.Float32) return BlockFormat.ValueType.Float32;
    return BlockFormat.ValueType.Int8;
}

function createDataLayer(header: Header, blockSize: number): DataLayer {
    const { extent } = header;
    const size = 2 * blockSize * extent[0] * extent[1];
    const buffer = File.createTypedArrayBufferContext(size, header.mode === Mode.Float32 ? File.ValueType.Float32 : File.ValueType.Int8);

    return {
        buffer,
        blockSize,
        startSlice: 0,
        endSlice: 0,
        values: buffer.values,
        valuesOffset: 0,
        readCount: 0,
        readHeight: 0,
        isFinished: false
    };
}

function compareProp(a: any, b: any) {
    if (a instanceof Array && b instanceof Array) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    return a === b;
}

export function compareHeaders(a: Header, b: Header) {
    for (let p of [ 'grid', 'axisOrder', 'extent', 'origin', 'spacegroupNumber', 'cellSize', 'cellAngles', 'mode' ]) {
        if (!compareProp((a as any)[p], (b as any)[p])) return false;
    }
    return true;
}

function getArray(r: (offset: number) => number, offset: number, count: number) {
    let ret:number[] = [];
    for (let i = 0; i < count; i++) {
        ret[i] = r(offset + i);
    }
    return ret;
}

async function readHeader(name: string, file: number) {
    const headerSize = 1024;
    const { buffer: data } = await File.readBuffer(file, 0, headerSize);        

    let littleEndian = true;

    let mode = data.readInt32LE(3 * 4);
    if (mode !== 0 && mode !== 2) {
        littleEndian = false;
        mode = data.readInt32BE(3 * 4, true);
        if (mode !== 0 && mode !== 2) {
            throw Error('Only CCP4 modes 0 and 2 are supported.');
        }
    }

    const readInt = littleEndian ? (o: number) => data.readInt32LE(o * 4) : (o: number) => data.readInt32BE(o * 4); 
    const readFloat = littleEndian ? (o: number) => data.readFloatLE(o * 4) : (o: number) => data.readFloatBE(o * 4);

    const origin2k = getArray(readFloat, 49, 3);
    const nxyzStart = getArray(readInt, 4, 3);
    const header: Header = {
        name,
        mode,
        grid: getArray(readInt, 7, 3),
        axisOrder: getArray(readInt, 16, 3).map(i => i - 1),
        extent: getArray(readInt, 0, 3),
        origin: origin2k[0] === 0.0 && origin2k[1] === 0.0 && origin2k[2] === 0.0 ? nxyzStart : origin2k,
        spacegroupNumber: readInt(22),
        cellSize: getArray(readFloat, 10, 3),
        cellAngles: getArray(readFloat, 13, 3),
        mean: readFloat(21),
        sigma: 0.0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        littleEndian,
        dataOffset: headerSize + readInt(23) /* symBytes */
    };

    header.grid = [header.grid[header.axisOrder[0]], header.grid[header.axisOrder[1]], header.grid[header.axisOrder[2]]];

    return header;
}

export async function readLayer(data: Data, sliceIndex: number) {
    if (sliceIndex >= data.numLayers) {
        data.layer.isFinished = true;
        return 0;
    }

    const layer = data.layer;
    const header = data.header;
    const { extent, mean } = header;
    const sliceSize = extent[0] * extent[1];    
    const sliceOffsetIndex = sliceIndex * layer.blockSize;
    const sliceByteOffset = layer.buffer.elementByteSize * sliceSize * sliceOffsetIndex;
    const sliceHeight = Math.min(layer.blockSize, extent[2] - sliceOffsetIndex);
    const sliceCount = sliceHeight * sliceSize;

    // are we in the top or bottom layer?
    const valuesOffset = (layer.readCount % 2) * layer.blockSize * sliceSize;
    let values: File.ValueArray;
    
    function updateSigma() {
        let sigma = header.sigma;
        let min = header.min;
        let max = header.max;
        for (let i = valuesOffset, _ii = valuesOffset + sliceCount; i < _ii; i++) {
            let v = values[i];
            let t = mean - v;
            sigma += t * t;
            if (v < min) min = v;
            else if (v > max) max = v;
        } 
        header.sigma = sigma;
        header.min = min;
        header.max = max;
    }

    values = await File.readTypedArray(layer.buffer, data.file, header.dataOffset + sliceByteOffset, sliceCount, valuesOffset, header.littleEndian);
    updateSigma();

    layer.readCount++;
    if (layer.readCount > 2) layer.startSlice += layer.blockSize;
    layer.endSlice += sliceHeight;
    layer.readHeight = sliceHeight;
    layer.valuesOffset = valuesOffset;

    if (sliceIndex >= data.numLayers - 1) {
        header.sigma = Math.sqrt(header.sigma / (extent[0] * extent[1] * extent[2]));
        layer.isFinished = true;
    }

    return sliceHeight;
}

export async function open(name: string, filename: string, blockSize: number): Promise<Data> {
    let file = await File.openRead(filename);
    let header = await readHeader(name, file);
    return <Data>{ 
        header, 
        file, 
        layer: createDataLayer(header, blockSize),
        numLayers: Math.ceil(header.extent[2] / blockSize) | 0
    };
}

