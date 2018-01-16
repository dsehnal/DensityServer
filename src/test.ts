/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

// import * as Data from './server/query/data-model'
// import * as Api from './server/api'
// import * as Coordinate from './server/algebra/coordinate'

import * as LocalApi from './server/local-api'

// import * as fs from 'fs'

// function wrapResponse(fn: string) {
//     const w = {
//         open(this: any) {
//             if (this.opened) return;
//             this.file = fs.openSync(fn, 'w');
//             this.opened = true;
//         },
//         writeBinary(this: any, data: Uint8Array) {
//             this.open();
//             fs.writeSync(this.file, new Buffer(data));
//             return true;
//         },
//         writeString(this: any, data: string) {
//             this.open();
//             fs.writeSync(this.file, data);
//             return true;
//         },
//         end(this: any) {
//             if (!this.opened || this.ended) return;
//             fs.close(this.file, function() { });
//             this.ended = true;
//         },
//         file: 0,
//         ended: false,
//         opened: false
//     };

//     return w;
// }

// async function query(src: string, id: string, asBinary: boolean, box: Data.QueryParamsBox, detail: number = 0, forcedSamplingLevel?: number) {

//     // const job: LocalApi.JobEntry = {
//     //     sourceFilename: `g:/test/mdb/${src}-${id}.mdb`,
//     //     sourceName: src,
//     //     sourceId: id,
//     // }

//     const params: Data.QueryParams = {
//         sourceFilename: `g:/test/mdb/${src}-${id}.mdb`,
//         sourceId: `${src}/${id}`,
//         asBinary,
//         box,
//         detail,
//         forcedSamplingLevel
//     };
//     const res = () => wrapResponse(`g:/test/${Api.getOutputFilename(src, id, params)}`);
//     await Api.queryBox(params, res)
// }

async function run() {
    // await query('xray', '1cbs', false, { 
    //     kind: 'Cartesian',
    //     a: Coordinate.cartesian(14.555000305175781, 16.075000762939453, 9.847999572753906),
    //     b: Coordinate.cartesian(29.30299949645996, 35.73699951171875, 32.03700065612793) 
    // });
    // await query('xray', '1cbs', true, { 
    //     kind: 'Cartesian',
    //     a: Coordinate.cartesian(14.555000305175781, 16.075000762939453, 9.847999572753906),
    //     b: Coordinate.cartesian(29.30299949645996, 35.73699951171875, 32.03700065612793) 
    // });

    // const job: LocalApi.JobEntry = {
    //     source: {
    //         filename: `g:/test/mdb/xray-1bzq.mdb`,
    //         name: 'xray',
    //         id: '1bzq',
    //     },
    //     query: {
    //         kind: 'box',
    //         space: 'cartesian',
    //         bottomLeft: [-58.055,-33.175,-26.281],
    //         topRight: [98.77,63.525,49.694]
    //     },
    //     params: {
    //         forcedSamplingLevel: 2,
    //         asBinary: true
    //     },
    //     outputFolder: 'g:/test/local-test'
    // }

    // LocalApi.run([job]);

    const job1: LocalApi.JobEntry = {
        source: {
            filename: `g:/test/mdb/emd-5725.mdb`,
            name: 'emd',
            id: '5725',
        },
        query: {
            kind: 'cell'
        },
        params: {
            // detail: 4,
            forcedSamplingLevel: 1,
            asBinary: true
        },
        outputFolder: 'g:/test/local-test'
    }

    LocalApi.run([job1]);

    // await query('xray', '1tqn', true, { 
    //     kind: 'Cartesian',
    //     a: Coordinate.cartesian(-42.996,-64.169,-45.335),
    //     b: Coordinate.cartesian(8.768,15.316,21.599) 
    // }, 0, 1);
    // await query('xray', '1tqn', true, { 
    //     kind: 'Cartesian',
    //     a: Coordinate.cartesian(-42.996,-64.169,-45.335),
    //     b: Coordinate.cartesian(8.768,15.316,21.599) 
    // }, 0, 2);

    // await query('xray', '1tqn', true, { 
    //     kind: 'Cartesian',
    //     a: Coordinate.cartesian(-22.367,-33.367,-21.634),
    //     b: Coordinate.cartesian(-7.106,-10.042,-0.937) 
    // }, 0, 1);
    // await query('xray', '1tqn', true, { 
    //     kind: 'Cartesian',
    //     a: Coordinate.cartesian(-22.367,-33.367,-21.634),
    //     b: Coordinate.cartesian(-7.106,-10.042,-0.937) 
    // }, 0, 2);

    // await query('emd', '8116', true, { kind: 'Cell' }, 0, 1);
    // await query('emd', '8116', true, { kind: 'Cell' }, 0, 2);
    // await query('emd', '8116', true, { kind: 'Cell' }, 0, 3);
    // await query('emd', '8116', true, { kind: 'Cell' }, 0, 4);
    // await query('emd', '8116', true, { kind: 'Cell' }, 0, 5);

    // await query('emd', '8116', false, { kind: 'Cell' });
    // await query('emd', '8116', true, { kind: 'Cell' }, 0);
    // await query('emd', '8116', true, { kind: 'Cell' }, 1);
    // await query('emd', '8116', true, { kind: 'Cell' }, 2);
    // await query('emd', '8116', true, { kind: 'Cell' }, 3);
    // await query('emd', '8116', true, { kind: 'Cell' }, 4);
    // await query('emd', '8116', true, { kind: 'Cell' }, 5);
    // await query('emd', '8116', true, { kind: 'Cell' }, 6);

    // await query('xray', '1cbs', false, { 
    //     kind: 'Fractional',
    //     a: Coordinate.fractional(0, 0, 0),
    //     b: Coordinate.fractional(6, 6, 6)
    // });
}

run();


