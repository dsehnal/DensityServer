/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Utils/File'
import * as Writer from './Writer'
import * as Data from './DataModel'
import * as Sampling from './Sampling'

function getTime() {
    let t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}

async function processLayers(ctx: Data.Context) {
    const numLayers = ctx.channels[0].numLayers;
    
    for (let i = 0; i < numLayers; i++) {
        for (const src of ctx.channels) {
            await CCP4.readLayer(src, i);
        }
        await Sampling.processLayer(ctx, i === (numLayers - 1));
    }
}
 
async function create(filename: string, sourceDensities: { name: string, filename: string }[], blockSize: number, isPeriodic: boolean) {
    const startedTime = getTime();

    if (blockSize % 2 !== 0 || blockSize < 8) {
        throw Error('Block size must be an even number greater than 8.');
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
        files.push(context.file.file);
        process.stdout.write('   done.\n');

        // Step 2: Allocate disk space.
        await Writer.allocateFile(context);

        // Step 3: Process and write the data 
        process.stdout.write('Writing data...    0%');
        await processLayers(context);
        process.stdout.write('\rWriting data...    done.\n');

        // Step 4: Write the header at the start of the file.
        // The header is written last because the sigma/min/max values are computed 
        // during step 3.
        process.stdout.write('Writing header... ');
        await Writer.writeHeader(context);
        process.stdout.write('done.\n');

        // Step 5: Report the time, d'ph.
        const time = getTime() - startedTime;
        console.log(`[Done] ${time.toFixed(0)}ms.`);
    } finally {
        for (let f of files) File.close(f);

        // const ff = await File.openRead(path.join(folder, '1.mdb'));
        // const hh = await BlockFormat.readHeader(ff);
        // File.close(ff);
        // console.log(hh);
    }
} 

export default async function pack(input: { name: string, filename: string}[], blockSize: number, isPeriodic: boolean, outputFilename: string) {
    try {
        await create(outputFilename, input, blockSize, isPeriodic);
    } catch (e) {
        console.error('[Error] ' + e);
    }
}