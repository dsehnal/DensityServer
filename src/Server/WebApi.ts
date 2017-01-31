/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as express from 'express'
import * as Query from './Query'
import * as Data from './DataModel'
import Docs from './Documentation'
import * as CIFTools from '../lib/CIFTools'
import ServerConfig from '../ServerConfig'
import * as Logger from '../Utils/Logger'

export const State = {
    pendingQueries: 0,
    shutdownOnZeroPending: false,
    querySerial: 0
}

function makePath(p: string) {
    return ServerConfig.apiPrefix + '/' + p;
}

function mapFile(type: string, id: string) {
    return ServerConfig.mapFile(type || '', id || '');
}

function getOutputFilename(source: string, id: string, isBinary: boolean, box: Data.Box) {
    function n(s: string) { return (s || '').replace(/[ \n\t]/g, '').toLowerCase() }
    let b = box.a.map(a => Math.round(a)).join('_') + '-' + box.b.map(a => Math.round(a)).join('_'); 
    return `${n(source)}_${n(id)}-${b}.${isBinary ? 'bcif' : 'cif'}`;
}

function wrapResponse(fn: string, res: express.Response): CIFTools.OutputStream & { headerWritten: boolean } {
    let w = {
        writeHeader(this: any, binary: boolean) {
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
        headerWritten: false
    };

    return w;
}

function queryDone() {
    State.pendingQueries--;
    if (State.shutdownOnZeroPending) {
        process.exit(0);
    }
}

function getTime() {
    let t = process.hrtime();
    return t[0] * 1000 + t[1] / 1000000;
}

function generateUUID() {
    var d = new Date().getTime() + getTime();    
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

export function init(app: express.Express) {
    app.get(makePath(':source/:id/?$'), async (req, res) => {
        State.pendingQueries++;

        Logger.log(`[Info] ${req.params.source}/${req.params.id}`);

        try {
            let info = await Query.info(mapFile(req.params.source, req.params.id))
            let ret = JSON.stringify(info, null, 2);

            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'X-Requested-With'
            });
            res.write(ret);
        } catch (e) {
            res.writeHead(404);
            Logger.log(`[Info] [Error] ${req.params.source}/${req.params.id}: ${e}`);
        } finally {
            res.end();
            queryDone();
        }
    });

    app.get(makePath(':source/:id/:a1,:a2,:a3/:b1,:b2,:b3/?'), async (req, res) => {   
        State.pendingQueries++;
        let qs = ++State.querySerial;
        let guid = generateUUID();

        Logger.log(`[GUID] ${guid}`, qs);
        Logger.log(`[Id] ${req.params.source}/${req.params.id}`, qs);
        Logger.log(`[Params] ${req.params.a1},${req.params.a2},${req.params.a3}/${req.params.b1},${req.params.b2},${req.params.b3}/?text=${req.query.text !== '1' ? '0' : '1'}`, qs);

        let started = getTime();
        let box: Data.Box = { 
            a: [+req.params.a1, +req.params.a2, +req.params.a3], 
            b: [+req.params.b1, +req.params.b2, +req.params.b3]
        };
        let asBinary = req.query.text !== '1';
        let fn = getOutputFilename(req.params.source, req.params.id, asBinary, box);
        let s = wrapResponse(fn, res);
        try {
            let params: Data.QueryParams = { asBinary, box, id: req.params.id, source: req.params.source, guid };    
            let ok = await Query.query(params, s);
            if (!ok) {
                res.writeHead(404);
                Logger.log('[Error] Failed.', qs);
                return;
            }
            Logger.log(`[OK]`, qs); 
        } catch (e) {
            if (!s.headerWritten) res.writeHead(404);
            Logger.log(`[Error] ${e}`, qs);            
        } finally {
            res.end();
            queryDone();
            let ended = getTime() - started;
            Logger.log(`[Time] ${Math.round(ended)}ms`, qs);
        }
    });

    app.get('*', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(Docs);
    });
} 