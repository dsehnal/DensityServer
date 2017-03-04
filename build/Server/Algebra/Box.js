/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Coords = require("./Coordinate");
///////////////////////////////////////////
// CONVERSIONS
///////////////////////////////////////////
function cartesianToFractional(box, spacegroup, axisOrder) {
    var l = box.a, r = box.b;
    var corners = [
        [l[0], l[1], l[2]],
        [r[0], l[1], l[2]],
        [l[0], r[1], l[2]],
        [l[0], l[1], r[2]],
        [r[0], r[1], l[2]],
        [r[0], l[1], r[2]],
        [l[0], r[1], r[2]],
        [r[0], r[1], r[2]],
    ].map(function (c) { return Coords.cartesianToFractional(Coords.cartesian(c), spacegroup, axisOrder); });
    return bounding(corners);
}
exports.cartesianToFractional = cartesianToFractional;
function fractionalToGrid(box, domain) {
    return { a: Coords.fractionalToGrid(box.a, domain, 'floor'), b: Coords.fractionalToGrid(box.b, domain, 'ceil') };
}
exports.fractionalToGrid = fractionalToGrid;
function gridToFractional(box) {
    return { a: Coords.gridToFractional(box.a), b: Coords.gridToFractional(box.b) };
}
exports.gridToFractional = gridToFractional;
function fractionalRoundToGrid(box, domain) {
    return { a: Coords.fractionalToGrid(box.a, domain, 'round'), b: Coords.fractionalToGrid(box.b, domain, 'round') };
}
exports.fractionalRoundToGrid = fractionalRoundToGrid;
///////////////////////////////////////////
// MISC
///////////////////////////////////////////
function shift(box, offset) {
    return { a: Coords.add(box.a, offset), b: Coords.add(box.b, offset) };
}
exports.shift = shift;
function clampGridToSamples(box) {
    return { a: Coords.clampGridToSamples(box.a), b: Coords.clampGridToSamples(box.b) };
}
exports.clampGridToSamples = clampGridToSamples;
function fractionalToDomain(box, kind, delta) {
    var ds = Coords.fractional(dimensions(box));
    return Coords.domain(kind, {
        delta: delta,
        origin: box.a,
        dimensions: ds,
        sampleCount: Coords.sampleCounts(ds, delta, 'ceil')
    });
}
exports.fractionalToDomain = fractionalToDomain;
function fractionalFromBlock(block) {
    var domain = block.domain;
    var a = Coords.gridToFractional(block);
    var b = Coords.add(a, domain.delta);
    for (var i = 0; i < 3; i++) {
        b[i] = Math.min(b[i], domain.origin[i] + domain.dimensions[i]);
    }
    return { a: a, b: b };
}
exports.fractionalFromBlock = fractionalFromBlock;
function bounding(xs) {
    var a = [xs[0][0], xs[0][1], xs[0][2]];
    var b = [xs[0][0], xs[0][1], xs[0][2]];
    for (var _i = 0, xs_1 = xs; _i < xs_1.length; _i++) {
        var x = xs_1[_i];
        for (var i = 0; i < 3; i++) {
            a[i] = Math.min(a[i], x[i]);
            b[i] = Math.max(b[i], x[i]);
        }
    }
    return { a: Coords.withCoord(xs[0], a), b: Coords.withCoord(xs[0], b) };
}
exports.bounding = bounding;
function areIntersecting(box1, box2) {
    for (var i = 0; i < 3; i++) {
        var x = box1.a[i], y = box1.b[i];
        var u = box2.a[i], v = box2.b[i];
        if (x > v || y < u)
            return false;
    }
    return true;
}
exports.areIntersecting = areIntersecting;
function intersect(box1, box2) {
    var a = [0.1, 0.1, 0.1];
    var b = [0.1, 0.1, 0.1];
    for (var i = 0; i < 3; i++) {
        var x = box1.a[i], y = box1.b[i];
        var u = box2.a[i], v = box2.b[i];
        if (x > v || y < u)
            return void 0;
        a[i] = Math.max(x, u);
        b[i] = Math.min(y, v);
    }
    return { a: Coords.withCoord(box1.a, a), b: Coords.withCoord(box1.a, b) };
}
exports.intersect = intersect;
function dimensions(box) {
    return [box.b[0] - box.a[0], box.b[1] - box.a[1], box.b[2] - box.a[2]];
}
exports.dimensions = dimensions;
