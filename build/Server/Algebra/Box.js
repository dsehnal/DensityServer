/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Coords = require("./Coordinate");
function cartesianToFractional(box, spacegroup, axisOrder) {
    return {
        a: Coords.cartesianToFractional(box.a, spacegroup, axisOrder),
        b: Coords.cartesianToFractional(box.b, spacegroup, axisOrder)
    };
}
exports.cartesianToFractional = cartesianToFractional;
function fractionalToGrid(box, domain) {
    return { a: Coords.fractionalToGrid(box.a, domain, 'floor'), b: Coords.fractionalToGrid(box.b, domain, 'ceil') };
}
exports.fractionalToGrid = fractionalToGrid;
function shift(box, offset) {
    return { a: Coords.add(box.a, offset), b: Coords.add(box.b, offset) };
}
exports.shift = shift;
function clampGridToSamples(box) {
    return { a: Coords.clampGridToSamples(box.a), b: Coords.clampGridToSamples(box.b) };
}
exports.clampGridToSamples = clampGridToSamples;
function bounding(xs) {
    var a = xs[0].coord.slice();
    var b = xs[1].coord.slice();
    for (var _i = 0, xs_1 = xs; _i < xs_1.length; _i++) {
        var x = xs_1[_i];
        for (var i = 0; i < 3; i++) {
            a[i] = Math.min(a[i], x.coord[i]);
            b[i] = Math.max(b[i], x.coord[i]);
        }
    }
    return { a: Coords.withCoord(xs[0], a), b: Coords.withCoord(xs[0], b) };
}
exports.bounding = bounding;
function areIntersecting(box1, box2) {
    for (var i = 0; i < 3; i++) {
        var x = box1.a.coord[i], y = box1.b.coord[i];
        var u = box2.a.coord[i], v = box2.b.coord[i];
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
        var x = box1.a.coord[i], y = box1.b.coord[i];
        var u = box2.a.coord[i], v = box2.b.coord[i];
        if (x > v || y < u)
            return void 0;
        a[i] = Math.max(x, u);
        b[i] = Math.min(y, v);
    }
    return { a: Coords.withCoord(box1.a, a), b: Coords.withCoord(box1.a, b) };
}
exports.intersect = intersect;
function dimensions(box) {
    return Coords.sub(box.b, box.a).coord;
}
exports.dimensions = dimensions;
function volume(box) {
    return dimensions(box).reduce(function (a, v) { return a * v; }, 1);
}
exports.volume = volume;
