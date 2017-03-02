// /*
//  * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
//  */
"use strict";
// import * as Coords from './CoordinateAlgebra'
// import * as Box from './BoxAlgebra'
// import * as Data from './DataModel'
// import { FastMap } from '../Utils/Collections'
// type Translations = Coords.Fractional[]
// /**
//  * Find the integer interval [x, y] so that for all k \in [x, y]
//  * k * [a, b] intersects with [u, v]
//  */
// function overlapMultiplierRange(a: number, b: number, u: number, v: number): number[] | undefined {
//     let x = Math.ceil(u - b) | 0, y =  Math.floor(v - a) | 0;
//     if (b + x < u) x++;
//     if (a + y > v) y--;
//     if (x > y) return void 0;
//     return [x, y];
// }
// /**
//  * Finds that list of "unit" offsets (in fractional space) so that
//  * shift(box, offset) has non-empty interaction with the region 
//  * described in the give domain.
//  */
// function findDataOverlapTranslationList(box: Box.Fractional, domain: Coords.GridDomain<any>): Translations {
//     const ranges = [];
//     const translations: Translations = [];
//     for (let i = 0; i < 3; i++) {
//         const range = overlapMultiplierRange(
//             box.a.coord[i], box.b.coord[i], 
//             domain.origin[i], domain.origin[i] + domain.dimensions[i]);
//         if (!range) return translations;
//         ranges[i] = range;
//     }
//     const [u, v, w] = ranges;
//     for (let k = w[0]; k <= w[1]; k++) {
//         for (let j = v[0]; j <= v[1]; j++) {
//             for (let i = u[0]; i <= u[1]; i++) {
//                 translations.push(Coords.fractional([i, j, k]));
//             }
//         }
//     }
//     return translations;
// }
// export type UniqueBlock = { coord: Coords.Grid<'Block'>, offsets: Coords.Fractional[] }
// type UniqueBlocks = FastMap<number, UniqueBlock>
// function addUniqueBlock(blocks: UniqueBlocks, coord: Coords.Grid<'Block'>, offset: Coords.Fractional) {
//     const hash = Coords.perfectGridHash(coord);
//     if (blocks.has(hash)) {
//         const entry = blocks.get(hash)!;
//         entry.offsets.push(offset);
//     } else {
//         blocks.set(hash, { coord, offsets: [offset] });
//     }
// }
// function findUniqueBlocksOffset(coords: Data.CoordinateContext, query: Data.QueryContext, offset: Coords.Fractional, blocks: UniqueBlocks) {
//     const shifted = Box.shift(query.box, offset);
//     const intersection = Box.intersect(shifted, coords.dataBox);
//     // this should not ever happen :)
//     if (!intersection) return;
//     // this gets the "3d range" of block indices that contain data that overlaps 
//     // with the query region.
//     //
//     // Clamping the data makes sure we avoid silly rounding errors (hopefully :))
//     const { a: { coord: min }, b: { coord: max } } 
//         = Box.clampGridToSamples(Box.fractionalToGrid(intersection, coords.blockDomain));
//     for (let i = min[0]; i < max[0]; i++) {
//         for (let j = min[1]; j < max[1]; j++) {
//             for (let k = min[2]; k < max[2]; k++) {
//                 addUniqueBlock(blocks, Coords.grid([i, j, k], coords.blockDomain), offset);
//             }                   
//         }    
//     }
// }
// /** Find a list of unique blocks+offsets that overlap with the query region. */
// export function findUniqueBlocks(coords: Data.CoordinateContext, query: Data.QueryContext) {
//     const translations = findDataOverlapTranslationList(query.box, coords.dataDomain);
//     const blocks: UniqueBlocks = FastMap.create<number, UniqueBlock>();
//     for (const t of translations) {
//         findUniqueBlocksOffset(coords, query, t, blocks);
//     }
//     const blockList = blocks.forEach((b, _, ctx) => { ctx!.push(b) }, [] as UniqueBlock[]);
//     // sort the data so that the first coodinate changes the fastest 
//     // this is because that's how the data is laid out in the underlaying 
//     // data format and reading the data 'in order' makes it faster.
//     blockList.sort((a, b) => {
//         const x = a.coord.coord, y = b.coord.coord;
//         for (let i = 2; i >= 0; i--) {
//             if (x[i] !== y[i]) return x[i] - y[i];
//         }
//         return 0;
//     });
//     return blockList;
// }
