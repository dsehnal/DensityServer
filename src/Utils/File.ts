/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as fs from 'fs'
import * as path from 'path'

const isNativeEndianLittle = new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412;

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

export function readBuffer(file: number, position: number, sizeOrBuffer: Buffer | number, size?: number): Promise<{ bytesRead: number, buffer: Buffer }> {
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

            fs.read(file, sizeOrBuffer, 0, size, position, (err, bytesRead, buffer) => {
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

const smallBufferSize = 128

export interface WriteContext {
    file: number,
    position: number,
    smallBuffer: Buffer
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
    return new Promise<WriteContext>((res, rej) => {
        if (fs.existsSync(filename)) fs.unlinkSync(filename);
        makeDir(path.dirname(filename));
        fs.open(filename, 'w', (err, file) => {
            if (err) rej(err);
            else res({ file, position: 0, smallBuffer: new Buffer(new ArrayBuffer(smallBufferSize)) });
        }) 
    });
}

export function close(file: number) {
    fs.close(file);
}

export async function writeInt(ctx: WriteContext, value: number) {
    ctx.smallBuffer.writeInt32LE(value, 0);
    let written = await writeBuffer(ctx.file, ctx.position, ctx.smallBuffer, 4);
    ctx.position += written;
}

export async function writeFloat(ctx: WriteContext, value: number, position?:number) {
    ctx.smallBuffer.writeFloatLE(value, 0);
    if (position === void 0) {
        let written = await writeBuffer(ctx.file, ctx.position, ctx.smallBuffer, 4);
        ctx.position += written;
    } else {
        await writeBuffer(ctx.file, position, ctx.smallBuffer, 4);
    }
}

export async function writeString(ctx: WriteContext, value: string, width: number) {
    if (value.length > width || width > smallBufferSize) throw Error('The string exceeds the maximum length.');
    for (let i = 0; i < value.length; i++) {
        if (value.charCodeAt(i) >= 0x7f) throw Error('Only one byte UTF8 strings can be written.');
    }
    value += new Array(width - value.length + 1).join(' ');
    ctx.smallBuffer.write(value);
    let written = await writeBuffer(ctx.file, ctx.position, ctx.smallBuffer, width);
    ctx.position += written;
}


export async function write(ctx: WriteContext, value: Buffer, size: number) {
    let written = await writeBuffer(ctx.file, ctx.position, value, size);
    ctx.position += written;
}


export const enum ValueType { Float32 = 0, Int8 = 1 }
export type ValueArray = Float32Array | Int8Array

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
    return new Int8Array(buffer);
}

export function createTypedArrayBufferContext(size: number, type: ValueType): TypedArrayBufferContext {
    let elementByteSize = getElementByteSize(type);
    let arrayBuffer = new ArrayBuffer(elementByteSize * size);
    let readBuffer = new Buffer(arrayBuffer); 
    let valuesBuffer = isNativeEndianLittle ? arrayBuffer : new ArrayBuffer(elementByteSize * size);
    return {
        type,
        elementByteSize,
        readBuffer,
        valuesBuffer: new Uint8Array(valuesBuffer),
        values: makeTypedArray(type, valuesBuffer)
    };
}

function flipByteOrder(source: Buffer, target: Uint8Array, byteCount: number, elementByteSize: number) {
    for (let i = 0, n = byteCount; i < n; i += elementByteSize) {
        for (let j = 0; j < elementByteSize; j++) { 
            target[i + elementByteSize - j - 1] = source[i + j];
        }
    }
}

export async function readTypedArray(ctx: TypedArrayBufferContext, file: number, position: number, count: number, littleEndian?: boolean) {
    let byteCount = ctx.elementByteSize * count;
    
    await readBuffer(file, position, ctx.readBuffer, byteCount);    
    if (ctx.elementByteSize > 1 && ((littleEndian !== void 0 && littleEndian !== isNativeEndianLittle) || !isNativeEndianLittle)) {
        // fix the endian 
        flipByteOrder(ctx.readBuffer, ctx.valuesBuffer, byteCount, ctx.elementByteSize);
    }
    return ctx.values;
}