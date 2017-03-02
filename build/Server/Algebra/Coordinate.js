/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var LA = require("./Linear");
/** Constructs spacegroup skew matrix from supplied info */
function spacegroup(info) {
    var cellAngles = info.angles, cellSize = info.size;
    var alpha = (Math.PI / 180.0) * cellAngles[0];
    var beta = (Math.PI / 180.0) * cellAngles[1];
    var gamma = (Math.PI / 180.0) * cellAngles[2];
    var xScale = cellSize[0], yScale = cellSize[1], zScale = cellSize[2];
    var z1 = Math.cos(beta);
    var z2 = (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma)) / Math.sin(gamma);
    var z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);
    var x = [xScale, 0.0, 0.0];
    var y = [Math.cos(gamma) * yScale, Math.sin(gamma) * yScale, 0.0];
    var z = [z1 * zScale, z2 * zScale, z3 * zScale];
    var fromFrac = LA.Matrix4.ofRows([
        [x[0], y[0], z[0], 0],
        [0, y[1], z[1], 0],
        [0, 0, z[2], 0],
        [0, 0, 0, 1.0]
    ]);
    var toFrac = LA.Matrix4.invert(LA.Matrix4.empty(), fromFrac);
    return __assign({}, info, { toFrac: toFrac, fromFrac: fromFrac });
}
exports.spacegroup = spacegroup;
///////////////////////////////////////////
// CONSTRUCTORS
///////////////////////////////////////////
function domain(kind, info) {
    return __assign({ kind: kind }, info);
}
exports.domain = domain;
function cartesian(coord) {
    return { kind: 0 /* Cartesian */, coord: coord };
}
exports.cartesian = cartesian;
function fractional(coord) {
    return { kind: 1 /* Fractional */, coord: coord };
}
exports.fractional = fractional;
function grid(coord, domain) {
    return { kind: 2 /* Grid */, domain: domain, coord: coord };
}
exports.grid = grid;
function withCoord(a, coord) {
    return __assign({}, a, { coord: coord });
}
exports.withCoord = withCoord;
///////////////////////////////////////////
// CONVERSIONS
///////////////////////////////////////////
function cartesianToFractional(a, spacegroup, axisOrder) {
    var coord = Helpers.transform(a.coord, spacegroup.toFrac);
    return fractional([coord[axisOrder[0]], coord[axisOrder[1]], coord[axisOrder[2]]]);
}
exports.cartesianToFractional = cartesianToFractional;
function fractionalToGrid(a, domain, snap) {
    var origin = domain.origin, dimensions = domain.dimensions, samples = domain.samples;
    var coord = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
        coord[i] = Helpers.snap((a.coord[i] - origin[i]) / dimensions[i] * samples[i], snap);
    }
    return grid(coord, domain);
}
exports.fractionalToGrid = fractionalToGrid;
function gridToFractional(a) {
    var _a = a.domain, origin = _a.origin, dimensions = _a.dimensions, samples = _a.samples;
    var coord = [0.1, 0.1, 0.1];
    for (var i = 0; i < 3; i++) {
        coord[i] = a.coord[i] * dimensions[i] / samples[i] + origin[i];
    }
    return fractional(coord);
}
exports.gridToFractional = gridToFractional;
///////////////////////////////////////////
// MISC
///////////////////////////////////////////
function clampGridToSamples(a) {
    var samples = a.domain.samples;
    var coord = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
        coord[i] = Math.max(Math.min(a.coord[i], samples[i]), 0);
    }
    return __assign({}, a, { coord: coord });
}
exports.clampGridToSamples = clampGridToSamples;
function add(a, b) {
    var x = a.coord, y = b.coord;
    return __assign({}, a, { coord: [x[0] + y[0], x[1] + y[1], x[2] + y[2]] });
}
exports.add = add;
function sub(a, b) {
    var x = a.coord, y = b.coord;
    return __assign({}, a, { coord: [x[0] - y[0], x[1] - y[1], x[2] - y[2]] });
}
exports.sub = sub;
function isInDomain(a, domain) {
    var coord = a.coord;
    var dimensions = domain.dimensions, origin = domain.origin;
    for (var i = 0; i < 3; i++) {
        var c = coord[i] - origin[i];
        if (c < 0 || c > dimensions[i])
            return false;
    }
    return true;
}
exports.isInDomain = isInDomain;
/** Maps each grid point to a unique integer */
function perfectGridHash(a) {
    var coord = a.coord;
    var samples = a.domain.samples;
    return coord[0] + samples[0] * (coord[1] + coord[2] * samples[1]);
}
exports.perfectGridHash = perfectGridHash;
var Helpers;
(function (Helpers) {
    var u = { x: 0.1, y: 0.1, z: 0.1 };
    var v = { x: 0.1, y: 0.1, z: 0.1 };
    var applyTransform = LA.Matrix4.transformVector3;
    function transformInPlace(x, matrix) {
        u.x = x[0];
        u.y = x[1];
        u.z = x[2];
        applyTransform(v, u, matrix);
        x[0] = v.x;
        x[1] = v.y;
        x[2] = v.z;
        return x;
    }
    Helpers.transformInPlace = transformInPlace;
    function transform(x, matrix) {
        return transformInPlace([x[0], x[1], x[2]], matrix);
    }
    Helpers.transform = transform;
    function snap(v, to) {
        return to === 'floor' ? Math.floor(v) | 0 : Math.ceil(v);
    }
    Helpers.snap = snap;
})(Helpers || (Helpers = {}));
