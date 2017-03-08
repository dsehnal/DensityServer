/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'

function tr(v: number, max: number) {
    if (v < 0) return 0;
    if (v > max - 1) return max - 1;
    return v;
}

/**
 * Map from L-th slice in src to an array of dimensions (srcDims[1], (srcDims[0] / 2), 1)
 */
export function downsample(src: Data.Sampling, target: Data.Sampling, blockSize: number) {
    

    const sizeH = src.sampleCount[0], sizeK = src.sampleCount[1], srcBaseOffset = (src.blocks.slicesWritten - 1) * sizeH * sizeK;
    const targetH = Math.floor((sizeH + 1) / 2), tarBaseOffset = (target.blocks.slicesWritten) * targetH * sizeK;
    //const w = 1.0 / (1 + 2 * 68+ 1);

    for (let chan = 0; chan < src.blocks.values.length; chan++) {

        const s = src.blocks.values[chan];
        const t = target.blocks.values[chan];

        for (let k = 0; k < sizeK; k++) {
            for (let h = 0; h < targetH; h++) {
                const hh = 2 * h;
                const o = srcBaseOffset + k * sizeH;
                // t[tarBaseOffset + k * targetH + h] = //s[srcBaseOffset + k * sizeH + hh];                
                //     1 / 4 * (
                //      s[o + tr(hh - 1, sizeH)] + 
                //          1 * (
                //             s[o + tr(hh, sizeH)] 
                //             + s[o + tr(hh, sizeH + 1)]) 
                //          + s[o + tr(hh, sizeH + 2)]);

                t[tarBaseOffset + k * targetH + h] = //s[srcBaseOffset + k * sizeH + hh];                
                    1 / 16 * (
                      + s[o + tr(hh - 2, sizeH)]
                      + 4 * s[o + tr(hh - 1, sizeH)]
                      + 6 * s[o + tr(hh, sizeH)] 
                      + 4 * s[o + tr(hh + 1, sizeH)] 
                      + s[o + tr(hh + 2, sizeH)]);
            }        
        }
    }
    
    target.blocks.slicesWritten++;
    target.blocks.isFull = target.blocks.slicesWritten === blockSize;

    //console.log('X', target);
}