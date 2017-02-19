/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Utils/File'

interface DensityBlockContext {
    file: File.WriteContext,
    sources: CCP4.Data[],
    blockSize: number,
    sigmasOffset: number,
    
    progress: number,
    progressMax: number
}

interface CubeContext {
    size: number,
    buffer: Buffer,
    extent: number[],
    numU: number,
    numV: number
}

async function writeHeader(ctx: DensityBlockContext) {
    
    let header = ctx.sources[0].header;

    // Layout
    // 1     Magic constant/byte order
    await File.writeInt(ctx.file, 0x1237);

    // 1     N = Num densities
    await File.writeInt(ctx.file, ctx.sources.length);

    ////////////////////////////////////////////////////////

    // 0:1   Format ID (0 = float32 values, 1 = int8 values)
    await File.writeInt(ctx.file, header.mode == CCP4.Mode.Float32 ? 0 : 1);

    // 1:3   Grid size
    for (let v of header.grid) await File.writeInt(ctx.file, v);

    // 4:1   Block size
    await File.writeInt(ctx.file, ctx.blockSize);

    // 5:3   Axis order
    for (let v of header.axisOrder) await File.writeInt(ctx.file, v);

    // 8:3   Extent
    for (let v of header.extent) await File.writeInt(ctx.file, v);

    // 11:3   Origin
    for (let v of header.origin) await File.writeFloat(ctx.file, v);

    // 14:1   Spacegroup number
    await File.writeInt(ctx.file, header.spacegroupNumber);

    // 15:6   Cell (dimensions + angles)
    for (let v of header.cellSize) await File.writeFloat(ctx.file, v);
    for (let v of header.cellAngles) await File.writeFloat(ctx.file, v);

    // 21:N  Density means
    for (let v of ctx.sources) await File.writeFloat(ctx.file, v.header.mean);

    ctx.sigmasOffset = ctx.file.position;
    // (21+N):N   Density sigmas
    for (let v of ctx.sources) await File.writeFloat(ctx.file, v.header.sigma);

    // (21+2N):N   Density mins
    for (let v of ctx.sources) await File.writeFloat(ctx.file, v.header.min);

    // (21+3N):N   Density mins
    for (let v of ctx.sources) await File.writeFloat(ctx.file, v.header.max);

    // (21+4*N):8*N  Density names (32 chars max each)
    for (let v of ctx.sources) await File.writeString(ctx.file, v.header.name, 32);

    // <BLOCK_00><BLOCK_01>...<BLOCK_0N>
    // <BLOCK_K0><BLOCK_K1>...<BLOCK_KN>   
}

async function writeInfo(ctx: DensityBlockContext) {
    let o = 0;
    for (let v of ctx.sources) {
        await File.writeFloat(ctx.file, v.header.sigma, ctx.sigmasOffset + o);
        o += 4;
    }
    for (let v of ctx.sources) {
        await File.writeFloat(ctx.file, v.header.min, ctx.sigmasOffset + o);
        o += 4;
    }
    for (let v of ctx.sources) {
        await File.writeFloat(ctx.file, v.header.max, ctx.sigmasOffset + o);
        o += 4;
    }
}

function createCubeContext(ctx: DensityBlockContext): CubeContext {
    let src = ctx.sources[0];    
    return {
        buffer: new Buffer(new ArrayBuffer(src.slice.data.elementByteSize * ctx.blockSize * ctx.blockSize * ctx.blockSize)),
        size: ctx.blockSize,
        extent: src.header.extent,
        numU: Math.ceil(src.header.extent[0] / ctx.blockSize) | 0,
        numV: Math.ceil(src.header.extent[1] / ctx.blockSize) | 0
    }
}

function fillCube(slice: CCP4.SliceContext, { size, buffer, extent }: CubeContext, u: number, v: number) {
    let oH = size * u;
    let oK = size * v;
    let sizeH = extent[0];
    let sizeHK = extent[0] * extent[1]; 

    let cH = Math.min(size, extent[0] - oH);
    let cK = Math.min(size, extent[1] - oK);
    let cL = slice.height;

    let values = slice.data.values; 

    let elementByteSize = slice.data.elementByteSize;

    let isFloat = slice.data.type === File.ValueType.Float32;
    let offset = 0;   
    for (let l = 0; l < cL; l++) {
        for (let k = 0; k < cK; k++) {
            for (let h = 0; h < cH; h++) {
                let t = values[oH + h + (k + oK) * sizeH + l * sizeHK];
                if (isFloat) buffer.writeFloatLE(t, offset, true);
                else buffer.writeInt8(t, offset, true);
                offset += elementByteSize;
            }
        }        
    }

    return offset;
}

async function processSlice(ctx: DensityBlockContext, cube: CubeContext, sliceIndex: number) {
    for (let src of ctx.sources) {
        await CCP4.readSlice(src, sliceIndex);
    }

    for (let v = 0; v < cube.numV; v++) {
        for (let u = 0; u < cube.numU; u++) {
            for (let src of ctx.sources) {
                let numBytes = fillCube(src.slice, cube, u, v);
                await File.write(ctx.file, cube.buffer, numBytes);
                ctx.progress++;
                process.stdout.write(`\rWriting blocks...  ${(100 * ctx.progress / ctx.progressMax).toFixed(0)}%`);
            }
        }
    }
} 

async function processBlocks(numSlices: number, ctx: DensityBlockContext) {
    let cube = createCubeContext(ctx);
    ctx.progressMax = cube.numU * cube.numV * numSlices * ctx.sources.length;

    for (let i = 0; i < numSlices; i++) {
        await processSlice(ctx, cube, i);
    }
}

function getTime() {
    let t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}

async function create(filename: string, sourceDensities: { name: string, filename: string }[], blockSize: number) {
    let startedTime = getTime();

    if (!sourceDensities.length) {
        throw Error('Specify at least one source density.');
    }

    console.log(`Block Size: ${blockSize}.`);
    process.stdout.write('Initializing... ');
    let files: number[] = [];
    try {
        let sources: CCP4.Data[] = [];
        for (let s of sourceDensities) sources.push(await CCP4.open(s.name, s.filename, blockSize));
        let ctx: DensityBlockContext = {
            file: await File.createFile(filename),
            sources,
            blockSize,
            sigmasOffset: 0,
            progress: 0,
            progressMax: 0
        }
        files.push(ctx.file.file);
        for (let s of sources) files.push(s.file);
        process.stdout.write('   done.\n');

        let isOk = ctx.sources.reduce((ok, s) => ok && CCP4.compareHeaders(ctx.sources[0].header, s.header), true);
        if (!isOk) {
            throw new Error('Input file headers are not compatible (different grid, etc.).');
        }

        process.stdout.write('Writing header... ');
        await writeHeader(ctx);
        process.stdout.write(' done.\n');

        process.stdout.write('Writing blocks... ');
        await processBlocks(ctx.sources[0].numSlices, ctx);
        process.stdout.write('\rWriting blocks...  done.\n');

        process.stdout.write('Updating info... ');
        await writeInfo(ctx);
        process.stdout.write('done.\n');

        let time = getTime() - startedTime;
        console.log(`[Done] ${time.toFixed(0)}ms.`);
    } finally {
        for (let f of files) File.close(f);
    }
} 

export default async function pack(input: { name: string, filename: string}[], blockSize: number, outputFilename: string) {
    try {
        await create(outputFilename, input, blockSize);
    } catch (e) {
        console.error('[Error] ' + e);
    }
}