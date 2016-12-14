/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

export function formatTime(t: number) {
    if (isNaN(t)) return 'n/a';

    let h = Math.floor(t / (60 * 60 * 1000)),
        m = Math.floor(t / (60 * 1000) % 60),
        s = Math.floor(t / 1000 % 60),
        ms = Math.floor(t % 1000).toString();

    while (ms.length < 3) ms = "0" + ms;

    if (h > 0) return `${h}h${m}m${s}.${ms}s`;
    if (m > 0) return `${m}m${s}.${ms}s`;
    if (s > 0) return `${s}.${ms}s`;
    return `${t.toFixed(0)}ms`;
}

export function log(msg: string, reqId?: number) {
    console.log(`[${new Date().toLocaleString('en-US')}]${reqId !== void 0 ? ` [${reqId}]` : ''} ${msg}`);
}

export function error(msg: string, reqId?: number) {
    console.error(`[${new Date().toLocaleString('en-US')}]${reqId !== void 0 ? ` [${reqId}]` : ''} ${msg}`);
}