/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
function getElementByteSize(header) {
    if (header.formatId === 0 /* Float32 */)
        return 4;
    return 1;
}
exports.getElementByteSize = getElementByteSize;
