// /*
//  * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
//  */

// import * as File from '../Utils/File'
// import * as Data from './DataModel'
// import { Coords, Box } from './Transforms'
// import * as LA from '../Utils/LinearAlgebra'
// import * as BlockFormat from '../Common/BlockFormat'

// function createCoordinateContext(header: BlockFormat.Header): Data.Coordinates {
//     // const { blockSize, origin, dimensions, samples } = header;
//     // const skew = Coords.makeSkewMatrices(header);
//     // const voxelSize = [dimensions[0] / samples[0], dimensions[1] / samples[1], dimensions[1] / samples[1]]

//     // return {
//     //     isAsymmetric: header.spacegroupNumber <= 0,
//     //     blockCount: Coords.map(e => Math.ceil(e / blockSize) | 0, samples),
//     //     voxelSize,
//     //     ...skew,
//     //     dataBox: { a: origin, b: Coords.add(origin, dimensions) }
//     // };
//     return 0 as any;
// }

// export async function open(filename: string): Promise<Data.DataContext> {
//     let file = await File.openRead(filename);

//     try {
//         let header = await BlockFormat.readHeader(file);
//         let coordinates = createCoordinateContext(header);
//         return { file, header, coordinates }
//     } catch (e) {
//         File.close(file);
//         throw e;
//     }
// }

// export async function readBlock(ctx: Data.DataContext, sampling: Data.Sampling, coord: number[]): Promise<Data.MultiBlock> {
//     let { box, dimensions, dataOffset } = Box.getBlockMetrics(ctx, coord);
//     let count = dimensions[0] * dimensions[1] * dimensions[2];
//     let data = File.createTypedArrayBufferContext(ctx.header.numDensities * count, ctx.header.formatId === BlockFormat.FormatId.Float32 ? File.ValueType.Float32 : File.ValueType.Int8);
//     let values = await File.readTypedArray(data, ctx.file, dataOffset, ctx.header.numDensities * count, 0);

//     return {
//         coord,
//         dimensions,
//         box,
//         values
//     };
// }

