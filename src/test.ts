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
            fs.close(this.file, function() { });
            this.ended = true;
        },
        file: 0,
        ended: false,
        opened: false
    };

    return w;
}

async function run() {
    // const params: Data.QueryParams = {
    //     sourceFilename: 'g:/test/mdb/xray-1cbs.mdb',
    //     sourceId: 'x-ray/1cbs',
    //     asBinary: false,
    //     //box: { a: Coordinate.fractional([0.1,0.1,0.1]), b: Coordinate.fractional([1,1,1]) },
    //     // box: { 
    //     //     a: Coordinate.fractional([0.31883898467579275, 0.3379941099552041, 0.12689084713255028]),
    //     //     b: Coordinate.fractional([0.6419057651331137, 0.7514086948151544, 0.4127947125514897]) 
    //     // },
    //     box: { 
    //         a: Coordinate.cartesian(14.555000305175781, 16.075000762939453, 9.847999572753906),
    //         b: Coordinate.cartesian(29.30299949645996, 35.73699951171875, 32.03700065612793) 
    //     },
    // }

    // await Query.execute(params, () => wrapResponse('g:/test/1cbs_2.cif'));

    const params1: Data.QueryParams = {
            sourceFilename: 'g:/test/mdb/emd-8116.mdb',
            sourceId: 'emd/zika',
            asBinary: true,
            //box: { a: Coordinate.fractional(0.1,0.1,0.1), b: Coordinate.fractional(0.3,0.3,0.3) },
            box: { a: Coordinate.fractional(-0.5,-0.5,-0.5), b: Coordinate.fractional(0.5,0.5,0.5) },
            // box: { 
            //     a: Coordinate.fractional([0.31883898467579275, 0.3379941099552041, 0.12689084713255028]),
            //     b: Coordinate.fractional([0.6419057651331137, 0.7514086948151544, 0.4127947125514897]) 
            // },
            // box: { 
            //     a: Coordinate.cartesian(14.555000305175781, 16.075000762939453, 9.847999572753906),
            //     b: Coordinate.cartesian(29.30299949645996, 35.73699951171875, 32.03700065612793) 
            // },
        }
        await Query.execute(params1, () => wrapResponse('g:/test/zika_4.bcif'));

    // for (let i = 0; i < 20; i++) {

    //     //(global as any).gc()

    //     const params1: Data.QueryParams = {
    //         sourceFilename: 'g:/test/mdb/xray-1a3l.mdb',
    //         sourceId: 'x-ray/1a3l',
    //         asBinary: true,
    //         //box: { a: Coordinate.fractional(0.1,0.1,0.1), b: Coordinate.fractional(0.3,0.3,0.3) },
    //         box: { a: Coordinate.fractional(0,0,0), b: Coordinate.fractional(1,1,1) },
    //         // box: { 
    //         //     a: Coordinate.fractional([0.31883898467579275, 0.3379941099552041, 0.12689084713255028]),
    //         //     b: Coordinate.fractional([0.6419057651331137, 0.7514086948151544, 0.4127947125514897]) 
    //         // },
    //         // box: { 
    //         //     a: Coordinate.cartesian(14.555000305175781, 16.075000762939453, 9.847999572753906),
    //         //     b: Coordinate.cartesian(29.30299949645996, 35.73699951171875, 32.03700065612793) 
    //         // },
    //     }

    //     await Query.execute(params1, () => wrapResponse('g:/test/1a3l.bcif'));
    
    // }
}

run();