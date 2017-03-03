/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Coords = require("../Algebra/Coordinate");
var Box = require("../Algebra/Box");
var Collections_1 = require("../Utils/Collections");
/**
 * Find the integer interval [x, y] so that for all k \in [x, y]
 * k * [a, b] intersects with [u, v]
 */
function overlapMultiplierRange(a, b, u, v) {
    var x = Math.ceil(u - b) | 0, y = Math.floor(v - a) | 0;
    if (b + x < u)
        x++;
    if (a + y > v)
        y--;
    if (x > y)
        return void 0;
    return [x, y];
}
/**
 * Finds that list of "unit" offsets (in fractional space) so that
 * shift(box, offset) has non-empty interaction with the region
 * described in the give domain.
 */
function findDataOverlapTranslationList(box, domain) {
    var ranges = [];
    var translations = [];
    for (var i = 0; i < 3; i++) {
        var range = overlapMultiplierRange(box.a.coord[i], box.b.coord[i], domain.origin[i], domain.origin[i] + domain.boxDimensions[i]);
        if (!range)
            return translations;
        ranges[i] = range;
    }
    var u = ranges[0], v = ranges[1], w = ranges[2];
    for (var k = w[0]; k <= w[1]; k++) {
        for (var j = v[0]; j <= v[1]; j++) {
            for (var i = u[0]; i <= u[1]; i++) {
                translations.push(Coords.fractional([i, j, k]));
            }
        }
    }
    return translations;
}
function addUniqueBlock(blocks, coord, offset) {
    var hash = Coords.perfectGridHash(coord);
    if (blocks.has(hash)) {
        var entry = blocks.get(hash);
        entry.offsets.push(offset);
    }
    else {
        blocks.set(hash, { coord: coord, offsets: [offset] });
    }
}
function findUniqueBlocksOffset(query, offset, blocks) {
    var shifted = Box.shift(query.box, offset);
    var intersection = Box.intersect(shifted, query.data.coordinates.dataBox);
    // this should not ever happen :)
    if (!intersection)
        return;
    var blockDomain = query.sampling.blockDomain;
    // this gets the "3d range" of block indices that contain data that overlaps 
    // with the query region.
    //
    // Clamping the data makes sure we avoid silly rounding errors (hopefully :))
    var _a = Box.clampGridToSamples(Box.fractionalToGrid(intersection, blockDomain)), min = _a.a.coord, max = _a.b.coord;
    for (var i = min[0]; i < max[0]; i++) {
        for (var j = min[1]; j < max[1]; j++) {
            for (var k = min[2]; k < max[2]; k++) {
                addUniqueBlock(blocks, Coords.grid([i, j, k], blockDomain), offset);
            }
        }
    }
}
/** Find a list of unique blocks+offsets that overlap with the query region. */
function findUniqueBlocks(query) {
    var translations = findDataOverlapTranslationList(query.box, query.sampling.dataDomain);
    var blocks = Collections_1.FastMap.create();
    for (var _i = 0, translations_1 = translations; _i < translations_1.length; _i++) {
        var t = translations_1[_i];
        findUniqueBlocksOffset(query, t, blocks);
    }
    var blockList = blocks.forEach(function (b, _, ctx) { ctx.push(b); }, []);
    // sort the data so that the first coodinate changes the fastest 
    // this is because that's how the data is laid out in the underlaying 
    // data format and reading the data 'in order' makes it faster.
    blockList.sort(function (a, b) {
        var x = a.coord.coord, y = b.coord.coord;
        for (var i = 2; i >= 0; i--) {
            if (x[i] !== y[i])
                return x[i] - y[i];
        }
        return 0;
    });
    return blockList;
}
exports.findUniqueBlocks = findUniqueBlocks;
