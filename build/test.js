/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import * as Box from './Server/Algebra/Box'
var Coordinate = require("./Server/Algebra/Coordinate");
var Query = require("./Server/Query/Execute");
var fs = require("fs");
function wrapResponse(fn) {
    var w = {
        open: function () {
            if (this.opened)
                return;
            this.file = fs.openSync(fn, 'w');
            this.opened = true;
        },
        writeBinary: function (data) {
            this.open();
            fs.writeSync(this.file, new Buffer(data));
            return true;
        },
        writeString: function (data) {
            this.open();
            fs.writeSync(this.file, data);
            return true;
        },
        end: function () {
            if (!this.opened || this.ended)
                return;
            fs.closeSync(this.file);
            this.ended = true;
        },
        file: 0,
        ended: false,
        opened: false
    };
    return w;
}
function run() {
    var params = {
        sourceFilename: 'g:/test/mdb/xray-1cbs.mdb',
        sourceId: 'x-ray/1cbs',
        asBinary: false,
        //box: { a: Coordinate.fractional([0.1,0.1,0.1]), b: Coordinate.fractional([1,1,1]) },
        box: { a: Coordinate.fractional([0.1, 0.1, 0.1]), b: Coordinate.fractional([0.3, 0.3, 0.3]) },
    };
    Query.execute(params, function () { return wrapResponse('g:/test/1cbs.cif'); });
}
run();
