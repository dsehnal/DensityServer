
const Config = {
    limits: {
        /**
         * Maximum number of blocks that could be read in 1 query.
         */
        maxRequestBlockCount: 32,

        /**
         * The maximum fractional dimension of the query box.
         */
        maxFractionalBoxDimension: 3,

        /**
         * What is the (approximate) maximum desired size in voxel count by precision level
         * Rule of thumb: <response gzipped size> \in [<voxel count> / 8, <voxel count> / 4];
         */
        maxOutputSizeInVoxelCountByPrecisionLevel: [
            0.5 * 1024 * 1024,
            1 * 1024 * 1024,
            2 * 1024 * 1024,
            4 * 1024 * 1024
        ]
    },

    /**
     * Specify the prefix of the API, i.e.
     * <host>/<apiPrefix>/<API queries>
     */
    apiPrefix: '/DensityServer',

    /**
     * If not specify otherwise by the 'port' environment variable, use this port.
     */
    defaultPort: 1337,

    /**
     * Node (V8) sometimes exhibits GC related issues  that significantly slow down the execution
     * (https://github.com/nodejs/node/issues/8670).
     * 
     * Therefore an option is provided that automatically shuts down the server.
     * For this to work, the server must be run using a deamon (i.e. forever.js on Linux
     * or IISnode on Windows) so that the server is automatically restarted when the shutdown happens.
     */
    shutdownParams: {
        // 0 for off, server will shut down after this amount of minutes.
        timeoutMinutes: 24 * 60 /* a day */,
        // modifies the shutdown timer by +/- timeoutVarianceMinutes (to avoid multiple instances shutting at the same time)
        timeoutVarianceMinutes: 60
    },

    /**
     * Maps a request identifier to a filename.
     * 
     * @param source 
     *   Source of the data.
     * @param id
     *   Id provided in the request. For xray, PDB id, for emd, EMDB id number. 
     */
    mapFile(source: string, id: string) {
        switch (source.toLowerCase()) {
            //case 'emd': return `e:/test/density_server/mdb/emd/${id.toLowerCase()}.mdb`;
            case 'emd': return `g:/test/mdb/emd-${id.toLowerCase()}.mdb`;
            //case 'x-ray': return `e:/test/density_server/mdb/x-ray/${id.toLowerCase()}.mdb`;
            case 'x-ray': return `g:/test/mdb/xray-${id.toLowerCase()}.mdb`;
            default: return void 0;
        }
    }
}

export default Config;