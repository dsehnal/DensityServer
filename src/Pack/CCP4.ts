/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as fs from 'fs'
import * as File from '../Utils/File'

export const enum Mode { Int8 = 0, Float32 = 2 }

export interface Header {
    name: string,
    mode: Mode,
    grid: number[],
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

export interface SliceContext {   
    data: File.TypedArrayBufferContext,

    /** Height of the current slice that was read */
    height: number,

    blockSize: number
}

export interface Data {
    header: Header,
    file: number,
    slice: SliceContext,
    numSlices: number
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
    let { bytesRead, buffer: data } = await File.readBuffer(file, 0, headerSize);        

    let littleEndian = true;

    let mode = data.readInt32LE(3 * 4);
    if (mode !== 0 && mode !== 2) {
        littleEndian = false;
        mode = data.readInt32BE(3 * 4, true);
        if (mode !== 0 && mode !== 2) {
            throw Error('Only CCP4 modes 0 and 2 are supported.');
        }
    }

    let readInt = littleEndian ? (o: number) => data.readInt32LE(o * 4) : (o: number) => data.readInt32BE(o * 4); 
    let readFloat = littleEndian ? (o: number) => data.readFloatLE(o * 4) : (o: number) => data.readFloatBE(o * 4);

    let header: Header = {
        name,
        mode,
        grid: getArray(readInt, 7, 3),
        axisOrder: getArray(readInt, 16, 3).map(i => i - 1),
        extent: getArray(readInt, 0, 3),
        origin: [0, 0, 0],
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

    let alpha = (Math.PI / 180.0) * header.cellAngles[0],
        beta = (Math.PI / 180.0) * header.cellAngles[1],
        gamma = (Math.PI / 180.0) * header.cellAngles[2];

    let xScale = header.cellSize[0] / header.grid[0],
        yScale = header.cellSize[1] / header.grid[1],
        zScale = header.cellSize[2] / header.grid[2];

    let z1 = Math.cos(beta),
        z2 = (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma)) / Math.sin(gamma),
        z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);

    let xAxis = [xScale, 0.0, 0.0],
        yAxis = [Math.cos(gamma) * yScale, Math.sin(gamma) * yScale, 0.0],
        zAxis = [z1 * zScale, z2 * zScale, z3 * zScale];
    
    let indices = [0, 0, 0];
    indices[header.axisOrder[0]] = 0;
    indices[header.axisOrder[1]] = 1;
    indices[header.axisOrder[2]] = 2;
                
    let origin2k = getArray(readFloat, 49, 3);
    let origin: number[];
    let nxyzStart = getArray(readInt, 4, 3);
    if (origin2k[0] === 0.0 && origin2k[1] === 0.0 && origin2k[2] === 0.0) {
        origin = [
            xAxis[0] * nxyzStart[indices[0]] + yAxis[0] * nxyzStart[indices[1]] + zAxis[0] * nxyzStart[indices[2]],
                                               yAxis[1] * nxyzStart[indices[1]] + zAxis[1] * nxyzStart[indices[2]],
                                                                                  zAxis[2] * nxyzStart[indices[2]]
        ];
    } else {
        origin = [origin2k[indices[0]], origin2k[indices[1]], origin2k[indices[2]]];
    }

    header.origin = origin;
    return header;
}

export async function readSlice(data: Data, sliceIndex: number) {
    if (sliceIndex >= data.numSlices) {
        return 0;
    }

    let slice = data.slice;
    let header = data.header;
    let values: File.ValueArray;
    let { extent, mean } = header;
    let sliceSize = extent[0] * extent[1];    
    let sliceOffsetIndex = sliceIndex * slice.blockSize;
    let sliceByteOffset = slice.data.elementByteSize * sliceSize * sliceOffsetIndex;
    let sliceHeight = Math.min(slice.blockSize, extent[2] - sliceOffsetIndex);
    let sliceCount = sliceHeight * sliceSize;

    slice.height = sliceHeight;    

    function updateSigma() {
        let sigma = header.sigma;
        let min = header.min;
        let max = header.max;
        for (let i = 0; i < sliceCount; i++) {
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

    values = await File.readTypedArray(slice.data, data.file, header.dataOffset + sliceByteOffset, sliceCount, header.littleEndian);
    updateSigma();

    if (sliceIndex >= data.numSlices - 1) {
        header.sigma = Math.sqrt(header.sigma / (extent[0] * extent[1] * extent[2]));
    }

    return sliceHeight;
}

function createSliceContext(header: Header, blockSize: number): SliceContext {
    let { extent } = header;
    let size = blockSize * extent[0] * extent[1];

    return {
        height: 0,
        blockSize: blockSize,
        data: File.createTypedArrayBufferContext(size, header.mode === Mode.Float32 ? File.ValueType.Float32 : File.ValueType.Int8)
    };
}

export async function open(name: string, filename: string, blockSize: number): Promise<Data> {
    let file = await File.openRead(filename);
    let header = await readHeader(name, file);
    return <Data>{ 
        header, 
        file, 
        slice: createSliceContext(header, blockSize),
        numSlices: Math.ceil(header.extent[2] / blockSize) | 0
    };
}

