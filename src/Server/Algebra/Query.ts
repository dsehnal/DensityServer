/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CA from './Coordinate'
import * as Box from './Box'
import { FastMap } from '../../Utils/Collections'

type Translations = CA.Fractional[]

function overlapMultiplierRange(a: number, b: number, u: number, v: number): number[] | undefined {
    let x = Math.ceil(u - b) | 0, y =  Math.floor(v - a) | 0;
    if (b + x < u) x++;
    if (a + y > v) y--;
    if (x > y) return void 0;
    return [x, y];
}

function findDataOverlapTranslationList(box: Box.Fractional): Translations {
    const data = box.a.domain;
    const ranges = [];
    const translations: Translations = [];

    for (let i = 0; i < 3; i++) {
        const range = overlapMultiplierRange(
            box.a.coord[i], box.b.coord[i], 
            data.origin[i], data.origin[i] + data.dimensions[i]);
        if (!range) return translations;
        ranges[i] = range;
    }

    const [u, v, w] = ranges;

    for (let k = w[0]; k <= w[1]; k++) {
        for (let j = v[0]; j <= v[1]; j++) {
            for (let i = u[0]; i <= u[1]; i++) {
                translations.push(CA.fractional([i, j, k], box.a.group, box.a.domain));
            }
        }
    }

    return translations;
}

export type UniqueBlock = { coord: CA.Block, offsets: CA.Fractional[] }
type UniqueBlocks = FastMap<number, UniqueBlock>


export function blockHash(a: CA.Block) {
    const coord = a.coord;
    const blockCount = a.domain.blockCount;
    return coord[0] + blockCount[0] * (coord[1] + coord[2] * blockCount[1]);
}

function addUniqueBlock(blocks: UniqueBlocks, coord: CA.Block, offset: CA.Fractional) {
    const hash = CA.blockHash(coord);
    if (blocks.has(hash)) {
        const entry = blocks.get(hash)!;
        entry.offsets.push(offset);
    } else {
        blocks.set(hash, { coord, offsets: [offset] });
    }
}

function findUniqueBlocksOffset(box: Box.Fractional, dataBox: Box.Fractional, offset: CA.Fractional, blocks: UniqueBlocks) {
    const shifted = Box.shift(box, offset);
    const intersection = Box.intersect(shifted, dataBox);
    const { coord: min } = CA.fractionalToBlock(intersection.a, 'floor');
    const { coord: max } = CA.fractionalToBlock(intersection.b, 'ceil');

    for (let i = min[0]; i < max[0]; i++) {
        for (let j = min[1]; j < max[1]; j++) {
            for (let k = min[2]; k < max[2]; k++) {
                addUniqueBlock(blocks, CA.block([i, j, k], box.a.group, box.a.domain), offset);
            }                   
        }    
    }
}

export function findUniqueBlocks(box: Box.Fractional) {
    const translations = findDataOverlapTranslationList(box);
    const blocks: UniqueBlocks = FastMap.create<number, UniqueBlock>();
    const data = box.a.domain;
    const dataBox: Box.Fractional = {
        a: CA.fractional(data.origin, box.a.group, box.a.domain),
        b: CA.add(CA.fractional(data.origin, box.a.group, box.a.domain), CA.fractional(data.dimensions, box.a.group, box.a.domain)),
    }
    for (const t of translations) {
        findUniqueBlocksOffset(box, dataBox, t, blocks);
    }
    const blockList = blocks.forEach((b, _, ctx) => { ctx!.push(b) }, [] as UniqueBlock[]);
    blockList.sort((a, b) => {
        const x = a.coord.coord, y = b.coord.coord;
        for (let i = 2; i >= 0; i--) {
            if (x[i] !== y[i]) return x[i] - y[i];
        }
        return 0;
    });
    return blockList;
}

