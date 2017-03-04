/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var compression = require("compression");
var WebApi = require("./Server/WebApi");
var Version_1 = require("./Server/Version");
var ServerConfig_1 = require("./ServerConfig");
var Logger = require("./Server/Utils/Logger");
var State_1 = require("./Server/State");
function setupShutdown() {
    if (ServerConfig_1.default.shutdownParams.timeoutVarianceMinutes > ServerConfig_1.default.shutdownParams.timeoutMinutes) {
        Logger.log('Server shutdown timeout variance is greater than the timer itself, ignoring.');
    }
    else {
        var tVar = 0;
        if (ServerConfig_1.default.shutdownParams.timeoutVarianceMinutes > 0) {
            tVar = 2 * (Math.random() - 0.5) * ServerConfig_1.default.shutdownParams.timeoutVarianceMinutes;
        }
        var tMs = (ServerConfig_1.default.shutdownParams.timeoutMinutes + tVar) * 60 * 1000;
        console.log("----------------------------------------------------------------------------");
        console.log("  The server will shut down in " + Logger.formatTime(tMs) + " to prevent slow performance.");
        console.log("  Please make sure a daemon is running that will automatically restart it.");
        console.log("----------------------------------------------------------------------------");
        console.log();
        setTimeout(function () {
            if (State_1.State.pendingQueries > 0) {
                State_1.State.shutdownOnZeroPending = true;
            }
            else {
                Logger.log("Shut down due to timeout.");
                process.exit(0);
            }
        }, tMs);
    }
}
var port = process.env.port || ServerConfig_1.default.defaultPort;
var app = express();
app.use(compression({ level: 6, memLevel: 9, chunkSize: 16 * 16384, filter: function () { return true; } }));
WebApi.init(app);
app.listen(port);
console.log("DensityServer " + Version_1.default + ", (c) 2016 - now, David Sehnal");
console.log("");
console.log("The server is running on port " + port + ".");
console.log("");
if (ServerConfig_1.default.shutdownParams && ServerConfig_1.default.shutdownParams.timeoutMinutes > 0) {
    setupShutdown();
}
