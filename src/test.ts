/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './Server/Query/DataModel'
//import * as Box from './Server/Algebra/Box'
import * as Coordinate from './Server/Algebra/Coordinate'
import * as Query from './Server/Query/Execute'

import * as fs from 'fs'

function wrapResponse(fn: string) {
    const w = {
        open(this: any) {
            if (this.opened) return;
            this.file = fs.openSync(fn, 'w');
            this.opened = true;
        },
        writeBinary(this: any, data: Uint8Array) {
            this.open();
            fs.writeSync(this.file, new Buffer(data));
            return true;
        },
        writeString(this: any, data: string) {
            this.open();
            fs.writeSync(this.file, data);
            return true;
        },
        end(this: any) {
            if (!this.opened || this.ended) return;
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
    const params: Data.QueryParams = {
        sourceFilename: 'g:/test/mdb/xray-1cbs.mdb',
        sourceId: 'x-ray/1cbs',
        asBinary: false,
        //box: { a: Coordinate.fractional([0.1,0.1,0.1]), b: Coordinate.fractional([1,1,1]) },
        box: { a: Coordinate.fractional([0.1,0.1,0.1]), b: Coordinate.fractional([0.3,0.3,0.3]) },
    }

    Query.execute(params, () => wrapResponse('g:/test/1cbs.cif'));
}

run();