/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import pack from './Pack/DensityBlock'
import VERSION from './Pack/Version'

let config = {
    input: <{ name: string, filename: string }[]>[],
    outputFilename: '',
    blockSize: 96 
};

function printHelp() {
    let help = [
        `DensityServer Packer ${VERSION}, (c) 2016 David Sehnal`,
        ``,
        `The input data must be CCP4/MAP mode 2 (32-bit floats) files.`,
        ``,
        `Usage: `,
        ``,
        `  node pack -v`,
        `    Print version.`,
        ``,
        `  node pack -xray main.ccp4 diff.ccp4 output.mdb [-blockSize 96]`,
        `    Pack main and diff density into a single block file.`,
        `    Optionally specify block size.`,
        ``,
        `  node pack -em density.map output.mdb [-blockSize 96]`,
        `    Pack single density into a block file.`, 
        `    Optionally specify block size.`
    ];
    console.log(help.join('\n'));
}

function parseInput() {
    let input = false;

    if (process.argv.length <= 2) {
        printHelp();
        process.exit();
        return false;
    }

    for (let i = 2; i < process.argv.length; i++) {
        switch (process.argv[i].toLowerCase()) {
            case '-blocksize':
                config.blockSize = +process.argv[++i];
                break;
            case '-xray':
                input = true;
                config.input = [
                    { name: '2Fo-Fc', filename: process.argv[++i] },
                    { name: 'Fo-Fc', filename: process.argv[++i] }
                ];
                config.outputFilename = process.argv[++i];
                break;
            case '-em':
                input = true;
                config.input = [
                    { name: 'em', filename: process.argv[++i] }
                ];
                config.outputFilename = process.argv[++i];
                break;
            case '-v':
                console.log(VERSION);
                process.exit();
                return false;
            default:
                printHelp();
                process.exit();
                return false;
        }
    }
    return input;
}

if (parseInput()) {
    pack(config.input, config.blockSize, config.outputFilename);
}