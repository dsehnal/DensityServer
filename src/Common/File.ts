/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as DataFormat from './DataFormat'

export const IsNativeEndianLittle = new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412;

export async function openRead(filename: string) {
    return new Promise<number>((res, rej) => {
        fs.open(filename, 'r', async (err, file) => {
            if (err) {
                rej(err);
                return;
            }

            try {                
                res(file);
            } catch (e) {
                fs.close(file);
            }
        })
    });
}

export function readBuffer(file: number, position: number, sizeOrBuffer: Buffer | number, size?: number, byteOffset?: number): Promise<{ bytesRead: number, buffer: Buffer }> {
    return new Promise((res, rej) => {
        if (typeof sizeOrBuffer === 'number') {
            let buff = new Buffer(new ArrayBuffer(sizeOrBuffer));
            fs.read(file, buff, 0, sizeOrBuffer, position, (err, bytesRead, buffer) => {
                if (err) {
                    rej(err);
                    return;
                }
                res({ bytesRead, buffer });
            });
        } else {
            if (size === void 0) {
                rej('readBuffeR: Specify size.');
                return;
            }

            fs.read(file, sizeOrBuffer, byteOffset ? +byteOffset : 0, size, position, (err, bytesRead, buffer) => {
                if (err) {
                    rej(err);
                    return;
                }
                res({ bytesRead, buffer });
            });
        }
    })
}

export function writeBuffer(file: number, position: number, buffer: Buffer, size?: number): Promise<number> {
    return new Promise<number>((res, rej) => {
        fs.write(file, buffer, 0, size !== void 0 ? size : buffer.length, position, (err, written) => {
            if (err) rej(err);
            else res(written);
        })
    })
}

function makeDir(path: string, root?: string): boolean {
    let dirs = path.split(/\/|\\/g),
        dir = dirs.shift();

    root = (root || '') + dir + '/';

    try { fs.mkdirSync(root); }
    catch (e) {
        if (!fs.statSync(root).isDirectory()) throw new Error(e);
    }

    return !dirs.length || makeDir(dirs.join('/'), root);
}

export function createFile(filename: string) {
    return new Promise<number>((res, rej) => {
        if (fs.existsSync(filename)) fs.unlinkSync(filename);
        makeDir(path.dirname(filename));
        fs.open(filename, 'w', (err, file) => {
            if (err) rej(err);
            else res(file);
        }) 
    });
}

export function close(file: number) {
    fs.closeSync(file);
}

const smallBuffer = new Buffer(8);
export async function writeInt(file: number, value: number, position: number) {    
    smallBuffer.writeInt32LE(value, 0);
    await writeBuffer(file, position, smallBuffer, 4);
}

import ValueType = DataFormat.ValueType
import ValueArray = DataFormat.ValueArray

export interface TypedArrayBufferContext {
    type: ValueType,
    elementByteSize: number,
    readBuffer: Buffer,
    valuesBuffer: Uint8Array,
    values: ValueArray
} 

function getElementByteSize(type: ValueType) {
    if (type === ValueType.Float32) return 4;
    return 1;
}

function makeTypedArray(type: ValueType, buffer: ArrayBuffer): ValueArray {
    if (type === ValueType.Float32) return new Float32Array(buffer);
    let ret = new Int8Array(buffer);
    return ret;
}

export function createTypedArrayBufferContext(size: number, type: ValueType): TypedArrayBufferContext {
    let elementByteSize = getElementByteSize(type);
    let arrayBuffer = new ArrayBuffer(elementByteSize * size);    
    let readBuffer = new Buffer(arrayBuffer); 
    let valuesBuffer = IsNativeEndianLittle ? arrayBuffer : new ArrayBuffer(elementByteSize * size);
    return {
        type,
        elementByteSize,
        readBuffer,
        valuesBuffer: new Uint8Array(valuesBuffer),
        values: makeTypedArray(type, valuesBuffer)
    };
}

function flipByteOrder(source: Buffer, target: Uint8Array, byteCount: number, elementByteSize: number, offset: number) {
    for (let i = 0, n = byteCount; i < n; i += elementByteSize) {
        for (let j = 0; j < elementByteSize; j++) { 
            target[offset + i + elementByteSize - j - 1] = source[offset + i + j];
        }
    }
}

export async function readTypedArray(ctx: TypedArrayBufferContext, file: number, position: number, count: number, valueOffset: number, littleEndian?: boolean) {
    let byteCount = ctx.elementByteSize * count;
    let byteOffset = ctx.elementByteSize * valueOffset;
    
    await readBuffer(file, position, ctx.readBuffer, byteCount, byteOffset);    
    if (ctx.elementByteSize > 1 && ((littleEndian !== void 0 && littleEndian !== IsNativeEndianLittle) || !IsNativeEndianLittle)) {
        // fix the endian 
        flipByteOrder(ctx.readBuffer, ctx.valuesBuffer, byteCount, ctx.elementByteSize, byteOffset);
    }
    return ctx.values;
}

export function ensureLittleEndian(source: Buffer, target: Buffer, byteCount: number, elementByteSize: number, offset: number) {
    if (IsNativeEndianLittle) return;
    if (!byteCount || elementByteSize <= 1) return;
    flipByteOrder(source, target, byteCount, elementByteSize, offset);
}