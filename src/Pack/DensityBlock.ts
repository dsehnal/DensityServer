/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as CCP4 from './CCP4'
import * as File from '../Utils/File'
import * as Writer from './Writer'
import * as BlockFormat from '../Common/BlockFormat'

import * as Convert from './Convert'
import * as Downsample from './Downsample'

import * as path from 'path'
import * as fs from 'fs'

function getTime() {
    let t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}

function getDownsampleRates(src: CCP4.Header, blockSize: number) {
    return [2, 4];
}

async function createContexts(folder: string, sources: CCP4.Data[], blockSize: number, downsample: boolean) {
    const src = sources[0];
    const progress: Writer.GlobalProgress = { current: 0, max: 0 };

    const convert = await Convert.createContext(path.join(folder, '1.mdb'), progress, sources, blockSize);

    if (!downsample) return { convert, downsamples: [] };

    const rates = getDownsampleRates(src.header, blockSize);
    const downsamples = [];
    for (const r of rates) downsamples.push(await Downsample.createContext(path.join(folder, `${r}.mdb`), progress, sources, blockSize, r));
    return { convert, downsamples };
}

async function processBlocks({ convert, downsamples }: { convert: Writer.Context, downsamples: Downsample.Context[] }) {
    const numSlices = convert.sources[0].numSlices;
    
    for (let i = 0; i < numSlices; i++) {
        for (const src of convert.sources) {
            await CCP4.readLayer(src, i);
        }
        await Convert.processLayer(convert);
        for (const sample of downsamples) await Downsample.processLayer(sample);
    }
}

async function createJsonInfo(filename: string, contexts: { convert: Writer.Context, downsamples: Downsample.Context[] }) {
    const header = { ...contexts.convert.blockHeader };
    delete header.dataByteOffset;
    (header as any).samplingRates = [1, ...contexts.downsamples.map(s => s.sampleRate)];
    return new Promise((res, rej) => {
        const json = JSON.stringify(header, null, 2);
        fs.writeFile(filename, json, err => {
            if (err) rej(err);
            else res();
        })
    });
}
 
async function create(folder: string, sourceDensities: { name: string, filename: string }[], blockSize: number, downsample = false) {
    const startedTime = getTime();

    if (!sourceDensities.length) {
        throw Error('Specify at least one source density.');
    }

    console.log(`Block Size: ${blockSize}.`);
    process.stdout.write('Initializing... ');
    const files: number[] = [];
    try {
        const sources: CCP4.Data[] = [];
        for (const s of sourceDensities) sources.push(await CCP4.open(s.name, s.filename, blockSize));
        const isOk = sources.reduce((ok, s) => ok && CCP4.compareHeaders(sources[0].header, s.header), true);
        if (!isOk) {
            throw new Error('Input file headers are not compatible (different grid, etc.).');
        }

        const contexts = await createContexts(folder, sources, blockSize, downsample);
        const all = [contexts.convert, ...contexts.downsamples];
        for (const s of sources) files.push(s.file);
        for (const ctx of all) files.push(ctx.file.file);
        process.stdout.write('   done.\n');

        process.stdout.write('Writing header... ');
        for (const ctx of all) {
            ctx.blockHeader = await Writer.writeHeader(ctx);
        }
        process.stdout.write(' done.\n');

        process.stdout.write('Writing data...    0%');
        await processBlocks(contexts);
        process.stdout.write('\rWriting data...    done.\n');

        process.stdout.write('Updating info...   ');
        for (const ctx of all) await Writer.writeInfo(ctx);
        await createJsonInfo(path.join(folder, 'info.json'), contexts);
        process.stdout.write('done.\n');

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

export default async function pack(input: { name: string, filename: string}[], blockSize: number, outputFilename: string) {
    try {
        await create(outputFilename, input, blockSize);
    } catch (e) {
        console.error('[Error] ' + e);
    }
}