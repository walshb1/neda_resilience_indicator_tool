var path = require("path"),
    fs = require('fs-extra'),
    sprintf = require('sprintf'),
    execSync = require('child_process').execSync,
    Q = require('q');

var png = {}

png.convert = function(config, svgs) {
    var pngs = [];
    for (var f in svgs) {
        var svg = svgs[f];
        var png = svg.split('.')[0] + '_thumb.png';
        // var width = config.map.width;
        // var height = config.map.height;
        var cmd = sprintf('convert -background transparent -resize %(resize)s %(svg)s %(png)s', {
            svg: svg,
            png: png,
            resize: '30%'
        });
        // convert the svg to png
        execSync(cmd);
        pngs.push(png);
    }
    return pngs;
}

module.exports = png;
