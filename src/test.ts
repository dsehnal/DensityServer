/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './Server/Query/DataModel'
import * as Api from './Server/Api'
import * as Coordinate from './Server/Algebra/Coordinate'

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
            fs.close(this.file, function() { });
            this.ended = true;
        },
        file: 0,
        ended: false,
        opened: false
    };

    return w;
}

async function query(src: string, id: string, asBinary: boolean, box: Data.QueryParamsBox) {
    const params: Data.QueryParams = {
        sourceFilename: `g:/test/mdb/${src}-${id}.mdb`,
        sourceId: `${src}/${id}`,
        asBinary,
        box,
        precision: 2
    };
    const res = () => wrapResponse(`g:/test/${Api.getOutputFilename(src, id, params.asBinary, params.box)}`);
    await Api.queryBox(params, res)
}

async function run() {
    await query('xray', '1cbs', false, { 
        kind: 'Cartesian',
        a: Coordinate.cartesian(14.555000305175781, 16.075000762939453, 9.847999572753906),
        b: Coordinate.cartesian(29.30299949645996, 35.73699951171875, 32.03700065612793) 
    });
    await query('xray', '1cbs', true, { 
        kind: 'Cartesian',
        a: Coordinate.cartesian(14.555000305175781, 16.075000762939453, 9.847999572753906),
        b: Coordinate.cartesian(29.30299949645996, 35.73699951171875, 32.03700065612793) 
    });

    await query('emd', '8116', false, { kind: 'Cell' });
    await query('emd', '8116', true, { kind: 'Cell' });

    await query('xray', '1cbs', false, { 
        kind: 'Fractional',
        a: Coordinate.fractional(0, 0, 0),
        b: Coordinate.fractional(6, 6, 6)
    });
}

run();