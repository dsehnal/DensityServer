/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as express from 'express'

import * as Api from './Api'

import * as Data from './Query/DataModel'
import * as Coords from './Algebra/Coordinate'
import Docs from './Documentation'
import * as CIFTools from '../lib/CIFTools'
import ServerConfig from '../ServerConfig'
import * as Logger from './Utils/Logger'
import { State } from './State'

function mapFile(type: string, id: string) {
    return ServerConfig.mapFile(type || '', id || '');
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

function getSourceInfo(req: express.Request) {
    return {
        filename: mapFile(req.params.source, req.params.id),
        id: `${req.params.source}/${req.params.id}`
    };
}

async function getHeader(req: express.Request, res: express.Response) {
    let headerWritten = false;

    try {
        const { filename, id } = getSourceInfo(req);
        const header = await Api.getHeaderJson(filename, id);
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'X-Requested-With'
        });
        headerWritten = true;
        res.write(header);        
    } catch (e) {
        Logger.errorPlain(`Header ${req.params.source}/${req.params.id}`, e);
        if (!headerWritten) {
            res.writeHead(404);
        }
    } finally {
        res.end();
    }
}

async function queryBox(req: express.Request, res: express.Response, isCell: boolean) {
    const a = [+req.params.a1, +req.params.a2, +req.params.a3]; 
    const b = [+req.params.b1, +req.params.b2, +req.params.b3];

    const isCartesian = (req.query.space || '').toLowerCase() !== 'fractional';

    const box: Data.QueryParamsBox = isCell
        ? { kind: 'Cell' }
        : ( isCartesian
            ? { kind: 'Cartesian', a: Coords.cartesian(a[0], a[1], a[2]), b: Coords.cartesian(b[0], b[1], b[2]) }
            : { kind: 'Fractional', a: Coords.fractional(a[0], a[1], a[2]), b: Coords.fractional(b[0], b[1], b[2]) });

    const asBinary = req.query.text !== '1';
    const outputFilename = Api.getOutputFilename(req.params.source, req.params.id, asBinary, box);
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
        
        let ok = await Api.queryBox(params, () => response);
        if (!ok) {
            response.do404();
            return;
        }
    } catch (e) {
        Logger.errorPlain(`Query Box ${JSON.stringify(req.params || {})} | ${JSON.stringify(req.query || {})}`, e);
        response.do404();           
    } finally {
        response.end();
        queryDone();
    }
}

export function init(app: express.Express) {
    function makePath(p: string) {
        return ServerConfig.apiPrefix + '/' + p;
    }

    // Header
    app.get(makePath(':source/:id/?$'), (req, res) => getHeader(req, res));
    // Box /:src/:id/box/:a1,:a2,:a3/:b1,:b2,:b3?text=0|1&space=cartesian|fractional
    app.get(makePath(':source/:id/box/:a1,:a2,:a3/:b1,:b2,:b3/?'), (req, res) => queryBox(req, res, false));
    // Cell /:src/:id/cell/?text=0|1&space=cartesian|fractional
    app.get(makePath(':source/:id/cell/?'), (req, res) => queryBox(req, res, true));

    app.get('*', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(Docs);
    });
} 