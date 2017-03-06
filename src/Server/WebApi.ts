/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as express from 'express'

import * as File from '../Common/File'
import * as Query from './Query/Execute'
import * as Data from './Query/DataModel'
import * as Box from './Algebra/Box'
import * as Coords from './Algebra/Coordinate'
import Docs from './Documentation'
import * as CIFTools from '../lib/CIFTools'
import ServerConfig from '../ServerConfig'
import * as Logger from './Utils/Logger'
import * as DataFormat from '../Common/DataFormat'
import { State } from './State'

function makePath(p: string) {
    return ServerConfig.apiPrefix + '/' + p;
}

function mapFile(type: string, id: string) {
    return ServerConfig.mapFile(type || '', id || '');
}

function getOutputFilename(source: string, id: string, isBinary: boolean, { a, b }: Box.Fractional | Box.Cartesian) {
    function n(s: string) { return (s || '').replace(/[ \n\t]/g, '').toLowerCase() }
    function r(v: number) { return Math.round(10 * v) / 10; }
    const box = `${r(a[0])}_${r(a[1])}+${r(a[2])}_${r(b[0])}_${r(b[1])}+${r(b[2])}`;
    return `${n(source)}_${n(id)}-${box}.${isBinary ? 'bcif' : 'cif'}`;
}

function wrapResponse(fn: string, res: express.Response) {
    const w = {
        do404(this: any) {
            if (!this.headerWritten) {
                res.writeHead(404);
                this.headerWritten = true;
            }
            this.end();
        },
        writeHeader(this: any, binary: boolean) {
            if (this.headerWritten) return;
            res.writeHead(200, {
                'Content-Type': binary ? 'application/octet-stream' : 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'X-Requested-With',
                'Content-Disposition': `inline; filename="${fn}"`
            });
            this.headerWritten = true;
        },
        writeBinary(this: any, data: Uint8Array) {
            if (!this.headerWritten) this.writeHeader(true);
            return res.write(new Buffer(data.buffer));
        },
        writeString(this: any, data: string) {
            if (!this.headerWritten) this.writeHeader(false);
            return res.write(data);
        },
        end(this: any) {
            if (this.ended) return;
            res.end();
            this.ended = true;
        },
        ended: false,
        headerWritten: false
    };

    return <(typeof w) & CIFTools.OutputStream>w;
}

function queryDone() {
    if (State.shutdownOnZeroPending) {
        process.exit(0);
    }
}

async function readHeader(src: string, id: string) {
    let file: number | undefined = void 0;
    try {
        const filename = mapFile(src, id);
        if (!filename) return void 0;
        file = await File.openRead(filename);
        const header = await DataFormat.readHeader(file);
        return header.header;
    } catch (e) {
        Logger.log(`[Info] [Error] ${src}/${id}: ${e}`);
        return void 0;
    } finally {
        File.close(file);
    }
}

export function init(app: express.Express) {
    // Header
    app.get(makePath(':source/:id/?$'), async (req, res) => {
        Logger.log(`[Info] ${req.params.source}/${req.params.id}`);
        let headerWritten = false;

        try {
            const header = await readHeader(req.params.source, req.params.id);
            if (header) {
                let json = JSON.stringify(header, null, 2);
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'X-Requested-With'
                });
                headerWritten = true;
                res.write(json);
            } else {
                res.writeHead(404);
                headerWritten = true;
            }
        } catch (e) {
            Logger.log(`[Info] [Error] ${req.params.source}/${req.params.id}: ${e}`);
            if (!headerWritten) {
                res.writeHead(404);
            }
        } finally {
            res.end();
        }
    });

    // Box /:src/:id/:a1,:a2,:a3/:b1,:b2,:b3?text=0|1&space=cartesian|fractional
    // Optional param
    app.get(makePath(':source/:id/box/:a1,:a2,:a3/:b1,:b2,:b3/?'), async (req, res) => {

        const a = [+req.params.a1, +req.params.a2, +req.params.a3]; 
        const b = [+req.params.b1, +req.params.b2, +req.params.b3];

        const isCartesian = (req.query.space || '').toLowerCase() !== 'fractional';

        const box: Box.Fractional | Box.Cartesian = isCartesian
            ? { a: Coords.cartesian(a[0], a[1], a[2]), b: Coords.cartesian(b[0], b[1], b[2]) }
            : { a: Coords.fractional(a[0], a[1], a[2]), b: Coords.fractional(b[0], b[1], b[2]) }
        const asBinary = req.query.text !== '1';
        const outputFilename = getOutputFilename(req.params.source, req.params.id, asBinary, box);
        const response = wrapResponse(outputFilename, res);
        
        try {
            const sourceFilename = mapFile(req.params.source, req.params.id);
            if (!sourceFilename) {
                response.do404();
                return;
            }

            let params: Data.QueryParams = { 
                sourceFilename,
                sourceId: `${req.params.source}/${req.params.id}`,
                asBinary, 
                box, 
            };    
            
            let ok = await Query.execute(params, () => response);
            if (!ok) {
                response.do404();
                return;
            }
        } catch (e) {
            Logger.log(`[Error] ${e}`);
            response.do404();           
        } finally {
            response.end();
            queryDone();
        }
    });

    app.get('*', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(Docs);
    });
} 