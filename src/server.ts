/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import * as express from 'express'
import * as compression from 'compression'

import init from './server/web-api'
import VERSION from './server/version'
import ServerConfig from './server-config'
import * as Logger from './server/utils/logger'
import { State } from './server/state'

function setupShutdown() {
    if (ServerConfig.shutdownParams.timeoutVarianceMinutes > ServerConfig.shutdownParams.timeoutMinutes) {
        Logger.logPlain('Server', 'Shutdown timeout variance is greater than the timer itself, ignoring.');
    } else {
        let tVar = 0;
        if (ServerConfig.shutdownParams.timeoutVarianceMinutes > 0) {
            tVar = 2 * (Math.random() - 0.5) * ServerConfig.shutdownParams.timeoutVarianceMinutes;
        }
        let tMs = (ServerConfig.shutdownParams.timeoutMinutes + tVar) * 60 * 1000;

        console.log(`----------------------------------------------------------------------------`);
        console.log(`  The server will shut down in ${Logger.formatTime(tMs)} to prevent slow performance.`);
        console.log(`  Please make sure a daemon is running that will automatically restart it.`);
        console.log(`----------------------------------------------------------------------------`);
        console.log();

        setTimeout(() => {
            if (State.pendingQueries > 0) {
                State.shutdownOnZeroPending = true;
            } else {
                Logger.logPlain('Server', `Shut down due to timeout.`);
                process.exit(0);
            }
        }, tMs);
    }
}


let port = process.env.port || ServerConfig.defaultPort;

let app = express();
app.use(compression({ level: 6, memLevel: 9, chunkSize: 16 * 16384, filter: () => true }));
init(app);

app.listen(port);

console.log(`DensityServer ${VERSION}, (c) 2016 - now, David Sehnal`);
console.log(``);
console.log(`The server is running on port ${port}.`);
console.log(``);

if (ServerConfig.shutdownParams && ServerConfig.shutdownParams.timeoutMinutes > 0) {
    setupShutdown();
}