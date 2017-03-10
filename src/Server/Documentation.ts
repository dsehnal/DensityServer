/*
 * Copyright (c) 2016 - now, David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import VERSION from './Version'
import ServerConfig from '../ServerConfig'

function precision(i: number) {
     return `<span class='id'>${i}</span><small> (${Math.round(100 * ServerConfig.limits.maxOutputSizeInVoxelCountByPrecisionLevel[i] / 1000 / 1000) / 100 }M voxels)</small>`;
}
const precMax = ServerConfig.limits.maxOutputSizeInVoxelCountByPrecisionLevel.length - 1;

export default `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<link rel='shortcut icon' href='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAnUExURQAAAMIrHrspHr0oH7soILonHrwqH7onILsoHrsoH7soH7woILwpIKgVokoAAAAMdFJOUwAQHzNxWmBHS5XO6jdtAmoAAACZSURBVDjLxZNRCsQgDAVNXmwb9f7nXZEaLRgXloXOhwQdjMYYwpOLw55fBT46KhbOKhmRR2zLcFJQj8UR+HxFgArIF5BKJbEncC6NDEdI5SatBRSDJwGAoiFDONrEJXWYhGMIcRJGCrb1TOtDahfUuQXd10jkFYq0ViIrbUpNcVT6redeC1+b9tH2WLR93Sx2VCzkv/7NjfABxjQHksGB7lAAAAAASUVORK5CYII=' />
<title>DensityServer (${VERSION})</title>
<style>
html { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
body { margin: 0; font-family: "Helvetica Neue",Helvetica,Arial,sans-serif; font-weight: 300; color: #333; line-height: 1.42857143; font-size: 14px }
.container { padding: 0 15px; max-width: 970px; margin: 0 auto; }
small { font-size: 80% }
h2, h4 { font-weight: 500; line-height: 1.1; }
h2 { color: black; font-size: 24px; }
h4 { font-size: 18px; margin: 20px 0 10px 0 }
h2 small { color: #777; font-weight: 300 }
hr { box-sizing: content-box; height: 0; overflow: visible; }
a { background-color: transparent; -webkit-text-decoration-skip: objects; text-decoration: none }
a:active, a:hover { outline-width: 0; }
a:focus, a:hover { text-decoration: underline; color: #23527c }
.list-unstyled { padding: 0; list-style: none; margin: 0 0 10px 0 }
.cs-docs-query-wrap { padding: 24px 0; border-bottom: 1px solid #eee } 
.cs-docs-query-wrap > h2 { margin: 0; color: black; } 
.cs-docs-query-wrap > h2 > span { color: #DE4D4E; font-family: Menlo,Monaco,Consolas,"Courier New",monospace; font-size: 90% } 
.cs-docs-param-name, .cs-docs-template-link { color: #DE4D4E; font-family: Menlo,Monaco,Consolas,"Courier New",monospace }
table {margin: 0; padding: 0; }
table th { font-weight: bold; border-bottom: none; text-align: left; padding: 6px 12px }
td { padding: 6px 12px }
td:not(:last-child), th:not(:last-child) { border-right: 1px dotted #ccc }
tr:nth-child(even) { background: #f9f9f9 }
span.id  { color: #DE4D4E; font-family: Menlo,Monaco,Consolas,"Courier New",monospace; }
</style>
</head>
<body>
<div class="container">
<div style='text-align: center; margin-top: 48px'><img style='max-width: 100%' src='data:image/png;base64,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' alt='DensityServer' /></div>
<div style='text-align: center; margin-top: 12px;'>version <span style='font-weight: bold'>${VERSION}</span></div>

<div style='text-align: justify; padding: 24px 0; border-bottom: 1px solid #eee'>
  <p>
    <b>DensityServer</b> is a service for accessing subsets of volumetric density data. It automatically downsamples the data 
    depending on the volume of the requested region to reduce the bandwidth requirements and provide near-instant access to even the 
    largest data sets.
  </p>
  <p>
    It uses the text based <a href='https://en.wikipedia.org/wiki/Crystallographic_Information_File'>CIF</a> and binary 
    <a href='https://github.com/dsehnal/BinaryCIF' style='font-weight: bold'>BinaryCIF</a> 
    formats to deliver the data to the client. 
    The server support is integrated into the <a href='https://github.com/dsehnal/LiteMol' style='font-weight: bold'>LiteMol Viewer</a>.
  </p>
</div>

<div class="cs-docs-query-wrap">
  <h2>Data Header / Check Availability <span>/&lt;source&gt;/&lt;id&gt;</span><br> 
  <small>Returns a JSON response specifying if data is available and the maximum region that can be queried.</small></h2>
  <div id="coordserver-documentation-ambientResidues-body" style="margin: 24px 24px 0 24px">
    <h4>Example</h4>
    <a href="/DensityServer/x-ray/1cbs" class="cs-docs-template-link" target="_blank" rel="nofollow">/x-ray/1cbs</a>
    <h4>Parameters</h4>
    <table cellpadding="0" cellspacing="0" style='width: 100%'>
    <tbody><tr><th style='width: 80px'>Name</th><th>Description</th></tr>
    <tr>
    <td class="cs-docs-param-name">source</td>
    <td>Specifies the data source. Currently, <span class='id'>x-ray</span> and <span class='id'>emd</span> sources are supported.</td>
    </tr>
    <tr>
    <td class="cs-docs-param-name">id</td>
    <td>Id of the entry. For <span class='id'>x-ray</span>, use PDB ID and for <span class='id'>emd</span> use EMD data number.</td>
    </tr>
    </tbody></table>
  </div>
</div>

<div class="cs-docs-query-wrap">
  <h2>Box <span>/&lt;source&gt;/&lt;id&gt;/box/&lt;a,b,c&gt;/&lt;u,v,w&gt;?&lt;optional parameters&gt;</span><br> 
  <small>Returns density data inside the specified box for the given entry. For X-ray data, returns 2Fo-Fc and Fo-Fc volumes in a single response.</small></h2>
  <div style="margin: 24px 24px 0 24px">    
    <h4>Examples</h4>
    <a href="/DensityServer/emd/8003/box/-2,7,10/4,10,15.5?encoding=cif&space=cartesian" class="cs-docs-template-link" target="_blank" rel="nofollow">/emd/8003/box/-2,7,10/4,10,15.5?excoding=cif&space=cartesian</a><br>
    <a href="/DensityServer/x-ray/1cbs/box/0.1,0.1,0.1/0.23,0.31,0.18?space=fractional" class="cs-docs-template-link" target="_blank" rel="nofollow">/x-ray/1cbs/box/0.1,0.1,0.1/0.23,0.31,0.18?space=fractional</a>
    <h4>Parameters</h4>
    <table cellpadding="0" cellspacing="0" style='width: 100%'>
    <tbody><tr><th style='width: 80px'>Name</th><th>Description</th></tr>
    <tr>
    <td class="cs-docs-param-name">source</td>
    <td>Specifies the data source. Currently, <span class='id'>x-ray</span> and <span class='id'>emd</span> sources are supported.</td>
    </tr>
    <tr>
    <td class="cs-docs-param-name">id</td>
    <td>Id of the entry. For <span class='id'>x-ray</span>, use PDB ID and for <span class='id'>emd</span> use EMD data number.</td>
    </tr>
    <tr>
    <td class="cs-docs-param-name">a,b,c</td>
    <td>Bottom left corner of the query region in Cartesian coordinates.</td>
    </tr>
    <tr>
    <td class="cs-docs-param-name">u,v,w</td>
    <td>Top right corner of the query region in Cartesian coordinates.</td>
    </tr>
    <tr>
    <td class="cs-docs-param-name">encoding</td>
    <td>Determines if text based <span class='id'>CIF</span> or binary <span class='id'>BinaryCIF</span> encoding is used. An optional argument, default is <span class='id'>BinaryCIF</span> encoding.</td>
    </tr>
    <tr>
    <td class="cs-docs-param-name">space</td>
    <td>Determines the coordinate space the query is in. Can be <span class='id'>cartesian</span> or <span class='id'>fractional</span>. An optional argument, default values is <span class='id'>cartesian</span>.</td>
    </tr>
    <tr>
      <td class="cs-docs-param-name">precision</td>
      <td>
        Determines the maximum number of voxels the query can return. Possible values are in the range from ${precision(0)} to ${precision(precMax)}. 
        Default value is <span class='id'>0</span>.
      </td>
    </tr>
    </tbody></table>
  </div>
</div>

<div class="cs-docs-query-wrap">
  <h2>Cell <span>/&lt;source&gt;/&lt;id&gt;/cell?&lt;optional parameters&gt;</span><br> 
  <small>Returns (downsampled) volume data for the entire "data cell". For X-ray data, returns unit cell of 2Fo-Fc and Fo-Fc volumes, for EM data returns everything.</small></h2>
  <div style="margin: 24px 24px 0 24px">    
    <h4>Example</h4>
    <a href="/DensityServer/emd/8116/cell?precision=1" class="cs-docs-template-link" target="_blank" rel="nofollow">/DensityServer/emd/8116/cell?precision=1</a><br>
    <h4>Parameters</h4>
    <table cellpadding="0" cellspacing="0" style='width: 100%'>
    <tbody><tr><th style='width: 80px'>Name</th><th>Description</th></tr>
    <tr>
    <td class="cs-docs-param-name">source</td>
    <td>Specifies the data source. Currently, <span class='id'>x-ray</span> and <span class='id'>emd</span> sources are supported.</td>
    </tr>
    <tr>
    <td class="cs-docs-param-name">id</td>
    <td>Id of the entry. For <span class='id'>x-ray</span>, use PDB ID and for <span class='id'>emd</span> use EMD data number.</td>
    </tr>
    <tr>
    <td class="cs-docs-param-name">encoding</td>
    <td>Determines if text based <span class='id'>CIF</span> or binary <span class='id'>BinaryCIF</span> encoding is used. An optional argument, default is <span class='id'>BinaryCIF</span> encoding.</td>
    </tr>
    <tr>
      <td class="cs-docs-param-name">precision</td>
      <td>
        Determines the maximum number of voxels the query can return. Possible values are in the range from ${precision(0)} to ${precision(precMax)}. 
        Default value is <span class='id'>0</span>.
      </td>
    </tr>
    </tbody></table>
  </div>
</div>


<div style="color: #999;font-size:smaller;margin: 20px 0; text-align: right">&copy; 2016 &ndash; now, David Sehnal | Node ${process.version}</div>

</body>
</html>
`;