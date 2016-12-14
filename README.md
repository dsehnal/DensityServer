[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat)](https://github.com/dsehnal/LiteMol/blob/master/LICENSE)

![DensityServer](logo.png)

What is DensityServer
=====================

DensityServer is an application for serving slices of molecular density data. The main use case of the server is 
for browser-based viewing of the data. It uses the [BinaryCIF](https://github.com/dsehnal/BinaryCIF) format to 
deliver the data to the client. The server support is integrated into the [LiteMol](https://github.com/dsehnal/LiteMol) viewer.

Installing the Server 
=====================

- Install [Node.js](https://nodejs.org/en/) (tested on Node v6).
- Get the code:

    ```
    git clone https://github.com/dsehnal/DensityServer.git
    ```
    or [download it as ZIP](https://github.com/dsehnal/DensityServer/archive/master.zip). No building is required, only the `build` folder in the archive is needed.

- Prepare the data.

- Run the server.

Preparing the Data
------------------

For the server to work, CCP4/MAP (in mode 2, 32-bit floats) input data need to be converted into a custom block format. 
To achieve this, use the ``build/pack`` application.

- To prepare data from x-ray based methods, use: 

    ```
    node build/pack -xray main.ccp4 diff.ccp4 out.mdb
    ```

- For EMD data, use:

    ```
    node build/pack -em emd.map out.mdb
    ```

Running the Server
------------------

- Install production dependencies:

   ```
   npm install --only=production
   ```

- Update ``build/ServerConfig.js`` to link to your data and optionally tweak the other parameters.

- Run it:

    ```
    node build/server
    ```

    In production it is a good idea to use a service that will keep the server running, such as [forever.js](https://github.com/foreverjs/forever).

Building
========

- Get the code:

    ```
    git clone https://github.com/dsehnal/DensityServer.git
    ```

- Install dependencies:

    ```
    cd DensityServer
    npm install gulp -g
    npm install
    ```

- Build:

    ```
    gulp
    ```

Consuming the Data 
==================

The data can be consumed in any (modern) browser using the [CIFTools.js library](https://github.com/dsehnal/CIFTools.js) (or any other piece of code that
can read text or binary CIF). The order or raw values read from the ``_density_data.values`` field is the same as in the [CCP4 format](http://www.ccp4.ac.uk/html/maplib.html#description) with regards to the
``_density_info.axis_order`` and ``_density_info.extent``.

License
=======

This project is licensed under the Apache 2.0 license. See the `LICENSE` file for more info.