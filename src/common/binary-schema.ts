/*
 * Copyright (c) 2017 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CIF from '../lib/cif-tools'
import MsgPack = CIF.Binary.MessagePack

export type Bool = { kind: 'bool' }
export type Int = { kind: 'int' }
export type Float = { kind: 'float' }
export type String = { kind: 'string' }
export type Array = { kind: 'array', element: Element }
export type Prop = { element: Element, prop: string }
export type Obj = { kind: 'object', props: Prop[] }
// tslint:disable-next-line:array-type
export type Element = Bool | Int | Float | String | Array | Obj

export const bool: Bool = { kind: 'bool' };
export const int: Int = { kind: 'int' };
export const float: Float = { kind: 'float' };
export const str: String = { kind: 'string' };
// tslint:disable-next-line:array-type
export function array(element: Element): Array { return { kind: 'array', element }; }
export function obj<T>(schema: ((keyof T) | Element)[][]): Obj {
    return {
        kind: 'object',
        props: schema.map(s => ({
            element: s[1] as Element,
            prop: s[0] as string
        }))
    };
}

function byteCount(e: Element, src: any) {
    let size = 0;
    switch (e.kind) {
        case 'bool': size += 1; break;
        case 'int': size += 4; break;
        case 'float': size += 8; break;
        case 'string': size += 4 + MsgPack.utf8ByteCount(src); break;
        case 'array': {
            size += 4; // array length
            for (const x of src) {
                size += byteCount(e.element, x);
            }
            break;
        }
        case 'object': {
            for (const p of e.props) {
                size += byteCount(p.element, src[p.prop]);
            }
            break;
        }
    }
    return size;
}

function writeElement(e: Element, buffer: Buffer, src: any, offset: number) {
    switch (e.kind) {
        case 'bool': buffer.writeInt8(src ? 1 : 0, offset); offset += 1; break;
        case 'int': buffer.writeInt32LE(src | 0, offset); offset += 4; break;
        case 'float': buffer.writeDoubleLE(+src, offset); offset += 8; break;
        case 'string': {
            const val = '' + src;
            const size = MsgPack.utf8ByteCount(val);
            buffer.writeInt32LE(size, offset);
            offset += 4; // str len
            const str = new Uint8Array(size);
            MsgPack.utf8Write(str, 0, val);
            for (const b of <number[]><any>str) {
                buffer.writeUInt8(b, offset);
                offset++;
            }
            break;
        }
        case 'array': {
            buffer.writeInt32LE(src.length, offset);
            offset += 4; // array length
            for (const x of src) {
                offset = writeElement(e.element, buffer, x, offset);
            }
            break;
        }
        case 'object': {
            for (const p of e.props) {
                offset = writeElement(p.element, buffer, src[p.prop], offset);
            }
            break;
        }
    }
    return offset;
}

function write(element: Element, src: any) {
    const size = byteCount(element, src);
    const buffer = new Buffer(size);
    writeElement(element, buffer, src, 0);
    return buffer;
}

export function encode(element: Element, src: any): Buffer {
    return write(element, src);
}

function decodeElement(e: Element, buffer: Buffer, offset: number, target: { value: any }) {
    switch (e.kind) {
        case 'bool': target.value = !!buffer.readInt8(offset); offset += 1; break;
        case 'int': target.value = buffer.readInt32LE(offset); offset += 4; break;
        case 'float': target.value = buffer.readDoubleLE(offset); offset += 8; break;
        case 'string': {
            const size = buffer.readInt32LE(offset);
            offset += 4; // str len
            const str = new Uint8Array(size);
            for (let i = 0; i < size; i++) {
                str[i] = buffer.readUInt8(offset);
                offset++;
            }
            target.value = MsgPack.utf8Read(str, 0, size);
            break;
        }
        case 'array': {
            const array: any[] = [];
            const count = buffer.readInt32LE(offset);
            const element = { value: void 0 };
            offset += 4;
            for (let i = 0; i < count; i++) {
                offset = decodeElement(e.element, buffer, offset, element);
                array.push(element.value);
            }
            target.value = array;
            break;
        }
        case 'object': {
            const t = Object.create(null);
            const element = { value: void 0 };
            for (const p of e.props) {
                offset = decodeElement(p.element, buffer, offset, element);
                t[p.prop] = element.value;
            }
            target.value = t;
            break;
        }
    }
    return offset;
}

export function decode<T>(element: Element, buffer: Buffer, offset?: number) {
    const target = { value: void 0 as any };
    decodeElement(element, buffer, offset! | 0, target);
    return target.value as T;
}