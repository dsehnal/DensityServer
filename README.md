[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat)](https://github.com/dsehnal/DensityServer/blob/master/LICENSE)

![DensityServer](logo.png)

What is DensityServer
=====================

DensityServer is a service for accessing subsets of volumetric density data. It automatically downsamples the data depending on the volume of the requested region to reduce the bandwidth requirements and provide near-instant access to even the largest data sets.

It uses the text based CIF and binary [BinaryCIF](https://github.com/dsehnal/BinaryCIF) formats to deliver the data to the client. The server support is integrated into the 
[LiteMol Viewer](https://github.com/dsehnal/LiteMol).

There is an instance of the server at [WebChem](https://webchem.ncbr.muni.cz/DensityServer/) and PDBe.

Installing the Server 
=====================

- Install [Node.js](https://nodejs.org/en/) (tested on Node 6.* and 7.*; x64 version is strongly preferred).
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

- Update ``build/server-config.js`` to link to your data and optionally tweak the other parameters.

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

The data can be consumed in any (modern) browser using the [CIFTools.js library](https://github.com/dsehnal/CIFTools.js) (or any other piece of code that can read text or binary CIF).

The [Data Format](docs/DataFormat.md) document gives a detailed description of the server response format.

As a reference/example of the server usage, please see the implementation in [LiteMol](https://github.com/dsehnal/LiteMol) ([CIF.ts + Data.ts](https://github.com/dsehnal/LiteMol/tree/master/src/lib/Core/Formats/Density), [UI](https://github.com/dsehnal/LiteMol/tree/master/src/Viewer/Extensions/DensityStreaming)).

License
=======

This project is licensed under the Apache 2.0 license. See the [LICENSE](https://github.com/dsehnal/DensityServer/blob/master/LICENSE) file for more info.