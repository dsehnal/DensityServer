/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'
import * as DataFormat from '../Common/DataFormat'

/** A cube addressed by binary index 0bXYZ */
type Cube = number[]
function lerp(cube: Cube, tU: number, tV: number, tW: number) {    
    const tU1 = 1 - tU, tV1 = 1 - tV;
    return ((cube[0b000] * tU1 + cube[0b100] * tU) * tV1 + 
            (cube[0b010] * tU1 + cube[0b110] * tU) * tV) * (1 - tW) 
         + ((cube[0b001] * tU1 + cube[0b101] * tU) * tV1 + 
            (cube[0b011] * tU1 + cube[0b111] * tU) * tV) * tW;
}

function fillLerpCube(ctx: Data.LerpCube, values: DataFormat.ValueArray, i: number, j: number, k: number) {
    const { z0Offset, z1Offset, sizeI, cube } = ctx;
    cube[0b000] = values[z0Offset + j * sizeI + i];
    cube[0b001] = values[z1Offset + j * sizeI + i];
    cube[0b010] = values[z0Offset + (j + 1) * sizeI + i];
    cube[0b011] = values[z1Offset + (j + 1) * sizeI + i];
    cube[0b100] = values[z0Offset + j * sizeI + i + 1];
    cube[0b101] = values[z1Offset + j * sizeI + i + 1];
    cube[0b110] = values[z0Offset + (j + 1) * sizeI + i + 1];
    cube[0b111] = values[z1Offset + (j + 1) * sizeI + i + 1];
}

/** Advances sampling rate K */
function advanceSamplingKbase(sampling: Data.Sampling, ctx: Data.Context) {
    const { delta, sampleCount, rate } = sampling;
    const { lerpCube } = ctx;
    const mI = sampleCount[0] - 1, mJ = sampleCount[1] - 1, mK = rate - 1;
    let cubeI = 0, cubeJ = 0, cubeK = 0; 
    let channelIndex = 0;

    for (const channel of ctx.channels) {        
        const target = sampling.blocksLayer.values[channelIndex];
        fillLerpCube(lerpCube, channel.layer.values, cubeI, cubeJ, cubeK);

        let x = 0.0, y = 0.0, z = delta[2] * sampling.blocksLayer.lastProcessedSlice;
        
        for (let k = 0; k < mK; k++) {
            let w = z - Math.floor(z);
            for (let j = 0; j < mJ; j++) {
                let v = y - Math.floor(y);
                for (let i = 0; i < mI; i++) {
                    let u = x - Math.floor(x);
                    target[0] = lerp(lerpCube.cube, u, v, w);
                    x += delta[0];
                    const c = Math.floor(x);
                    if (c !== cubeI) {
                        cubeI = c;
                        fillLerpCube(lerpCube, channel.layer.values, cubeI, cubeJ, cubeK);
                    }
                }
                y += delta[1];
                const c = Math.floor(y);
                if (c !== cubeJ) {
                    cubeJ = c;
                    fillLerpCube(lerpCube, channel.layer.values, cubeI, cubeJ, cubeK);
                }
            }
            z += delta[2];
            const c = Math.floor(z);
            if (c !== cubeI) {
                cubeK = c;
                fillLerpCube(lerpCube, channel.layer.values, cubeI, cubeJ, cubeK);
                lerpCube.z0Offset = (lerpCube.z0Offset + ctx.lerpCube.sizeIJ) % channel.layer.values.length;
                lerpCube.z1Offset = (lerpCube.z1Offset + ctx.lerpCube.sizeIJ) % channel.layer.values.length;
            }
        }
        channelIndex++;
    }
}

/** Advances sampling rate K */
export function advanceSamplingK(K: number, sampling: Data.Sampling[], ctx: Data.Context) {

    // TODO: compute how many times we have advanced.
    // TODO: add the base to the multipliers

    const mult = 3 * sampling.length;
    for (let m = 0; m < mult; m++) {
        advanceSamplingKbase(sampling[0], ctx);
    }
}
