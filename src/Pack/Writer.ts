/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as Data from './DataModel'
import * as File from '../Common/File'
import * as DataFormat from '../Common/DataFormat'

/** Divides each value by rate^3 */
function averageSampling(sampling: Data.Sampling) {
    if (sampling.rate === 1) return;
    const factor = 1 / (sampling.rate * sampling.rate * sampling.rate);
    for (const buffer of sampling.blocksLayer.values) {
        for (let i = 0, _ii = buffer.length; i < _ii; i++) {
            buffer[i] = factor * buffer[i];
        }
    }
}

/** Fill a cube at position (u,v) with values from each of the channel */
function fillCubeBuffer(ctx: Data.Context, sampling: Data.Sampling, u: number, v: number): number {
    const { blockSize, cubeBuffer } = ctx;
    const { dimensions, buffers, slicesWritten } = sampling.blocksLayer;
    const elementSize = DataFormat.getValueByteSize(ctx.valueType);   
    const sizeH = dimensions[0], sizeHK = dimensions[0] * dimensions[1];
    const offsetH = u * blockSize, 
          offsetK = v * blockSize;
    const copyH = Math.min(blockSize, dimensions[0] - offsetH) * elementSize, 
          maxK = offsetK + Math.min(blockSize, dimensions[1] - offsetK), 
          maxL = slicesWritten;
    
    let writeOffset = 0;    
    for (const src of buffers) {
        for (let l = 0; l < maxL; l++) {
            for (let k = offsetK; k < maxK; k++) {
                const start = (l * sizeHK + k * sizeH + offsetH) * elementSize;
                src.copy(cubeBuffer, writeOffset, start, start + copyH);
                writeOffset += copyH;
            }
        }
    }
    File.ensureLittleEndian(ctx.cubeBuffer, ctx.litteEndianCubeBuffer, writeOffset, elementSize, 0);
    return writeOffset;
}

/** Converts a layer to blocks and writes them to the output file. */
async function writeSamplingLayer(ctx: Data.Context, sampling: Data.Sampling) {
    averageSampling(sampling);
    const nU = Math.ceil(sampling.blocksLayer.dimensions[0] / ctx.blockSize);
    const nV = Math.ceil(sampling.blocksLayer.dimensions[1] / ctx.blockSize);
    const startOffset = ctx.dataByteOffset + sampling.byteOffset;

    for (let v = 0; v < nV; v++) {
        for (let u = 0; u < nU; u++) {
            const size = fillCubeBuffer(ctx, sampling, u, v);
            await File.writeBuffer(ctx.file, startOffset + sampling.writeByteOffset, ctx.litteEndianCubeBuffer, size);
            sampling.writeByteOffset += size;
            updateProgress(ctx.progress, 1);
        }
    }
    sampling.blocksLayer.isFull = false;
    sampling.blocksLayer.slicesWritten = 0;
}

function updateProgress(progress: Data.Progress, progressDone: number) {
    let old = (100 * progress.current / progress.max).toFixed(0);
    progress.current += progressDone;
    let $new = (100 * progress.current / progress.max).toFixed(0);
    if (old !== $new) {
        process.stdout.write(`\rWriting data...    ${$new}%`);
    }
}

/** Writes all full buffers */
export async function writeCubeLayers(ctx: Data.Context) {
    for (const s of ctx.sampling) {
        if (!s.blocksLayer.isFull) continue;
        await writeSamplingLayer(ctx, s);
    }
} 