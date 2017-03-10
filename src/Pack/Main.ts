/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Common/File'
import * as Data from './DataModel'
import * as Sampling from './Sampling'
import * as DataFormat from '../Common/DataFormat'
import * as fs from 'fs'

export default async function pack(input: { name: string, filename: string }[], blockSize: number, isPeriodic: boolean, outputFilename: string) {
    try {
        await create(outputFilename, input, blockSize, isPeriodic);
    } catch (e) {
        console.error('[Error] ' + e);
    }
}

function getTime() {
    let t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}

function updateAllocationProgress(progress: Data.Progress, progressDone: number) {
    let old = (100 * progress.current / progress.max).toFixed(0);
    progress.current += progressDone;
    let $new = (100 * progress.current / progress.max).toFixed(0);
    if (old !== $new) {
        process.stdout.write(`\rAllocating...      ${$new}%`);
    }
}

/**
 * Pre allocate the disk space to be able to do "random" writes into the entire file. 
 */
async function allocateFile(ctx: Data.Context) {
    const { totalByteSize, file } = ctx;
    const buffer = new Buffer(Math.min(totalByteSize, 8 * 1024 * 1024));
    const progress: Data.Progress = { current: 0, max: Math.ceil(totalByteSize / buffer.byteLength) };
    let written = 0;
    while (written < totalByteSize) {
        written += fs.writeSync(file, buffer, 0, Math.min(totalByteSize - written, buffer.byteLength));
        updateAllocationProgress(progress, 1);
    }
}

async function writeHeader(ctx: Data.Context) {
    const header = DataFormat.encodeHeader(Data.createHeader(ctx));
    await File.writeInt(ctx.file, header.byteLength, 0);
    await File.writeBuffer(ctx.file, 4, header);
}

async function create(filename: string, sourceDensities: { name: string, filename: string }[], blockSize: number, isPeriodic: boolean) {
    const startedTime = getTime();

    if (blockSize % 4 !== 0 || blockSize < 4) {
        throw Error('Block size must be a positive number divisible by 4.');
    }

    if (!sourceDensities.length) {
        throw Error('Specify at least one source density.');
    }

    console.log(`Block Size: ${blockSize}.`);
    process.stdout.write('Initializing... ');
    const files: number[] = [];
    try {
        // Step 1a: Read the CCP4 headers
        const channels: CCP4.Data[] = [];
        for (const s of sourceDensities) channels.push(await CCP4.open(s.name, s.filename, blockSize));
        // Step 1b: Check if the CCP4 headers are compatible.
        const isOk = channels.reduce((ok, s) => ok && CCP4.compareHeaders(channels[0].header, s.header), true);
        if (!isOk) {
            throw new Error('Input file headers are not compatible (different grid, etc.).');
        }

        // Step 1c: Create data context.
        const context = await Sampling.createContext(filename, channels, blockSize, isPeriodic);
        for (const s of channels) files.push(s.file);
        files.push(context.file);
        process.stdout.write('   done.\n');

        // Step 2: Allocate disk space.        
        process.stdout.write('Allocating...      0%');
        await allocateFile(context);
        process.stdout.write('\rAllocating...      done.\n');

        // Step 3: Process and write the data 
        process.stdout.write('Writing data...    0%');
        await Sampling.processData(context);
        process.stdout.write('\rWriting data...    done.\n');

        // Step 4: Write the header at the start of the file.
        // The header is written last because the sigma/min/max values are computed 
        // during step 3.
        process.stdout.write('Writing header...  ');
        await writeHeader(context);
        process.stdout.write('done.\n');

        // Step 5: Report the time, d'ph.
        const time = getTime() - startedTime;
        console.log(`[Done] ${time.toFixed(0)}ms.`);
    } finally {
        for (let f of files) File.close(f);

        // const ff = await File.openRead(filename);
        // const hh = await DataFormat.readHeader(ff);
        // File.close(ff);
        // console.log(hh.header);
    }
} 