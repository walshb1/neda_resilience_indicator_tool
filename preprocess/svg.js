var path = require("path"),
    fs = require('fs-extra'),
    jsdom = require("jsdom"),
    topojson = require('topojson'),
    colorbrewer = require('colorbrewer'),
    sprintf = require('sprintf'),
    colorbrewer = require('colorbrewer'),
    Q = require('q'),
    d3 = require('d3');

var generate = {};


// Collects values for each of the output domains.
_populateOutputDomains = function(model_features) {
    var outputDomains = {
        'resilience': [],
        'risk': [],
        'risk_to_assets': [],
    }
    for (var f in model_features) {
        var feature = model_features[f];
        var res = feature.properties['resilience'];
        var wel = feature.properties['risk'];
        var assets = feature.properties['risk_to_assets'];
        if (res) {
            outputDomains['resilience'].push(res);
        }
        if (wel) {
            outputDomains['risk'].push(wel);
        }
        if (assets) {
            outputDomains['risk_to_assets'].push(assets);
        }
    }
    return outputDomains;
}

/*
 * generates color scales for output domains
 */
_colorScale = function(output, data) {
    var min = Math.floor(d3.min(data));
    var max = Math.ceil(d3.max(data));
    color_ranges = {
        'resilience': colorbrewer.Reds[5].reverse(),
        'risk': colorbrewer.Purples[5].reverse(),
        'risk_to_assets': colorbrewer.Blues[5]
    }

    //create quantile classes with color scale
    var colors = d3.scale.quantile()
        .domain([min, max])
        .range(color_ranges[output]);

    return colors; //return the color scale generator
}

_applyStyles = function(svg, styles) {
    for (var style in styles) {
        var s = styles[style];
        svg.selectAll('.' + style)
            .call(_styles(s));
    }
}

_styles = function(styles) {
    return function(selection) {
        for (var property in styles) {
            selection.style(property, styles[property]);
        }
    };
}


generate.svg = function(file, config) {

    var d = Q.defer();
    // pull out svg configuration values
    var width = config.map.width;
    var height = config.map.height;
    var outputs = config.outputs;
    var styles = config.svg.styles;
    var svgs = [];

    scripts = [
        "node_modules/d3/d3.min.js",
        "node_modules/d3-geo-projection.min.js"
    ];

    // get the topojson
    var model_data = fs.readFileSync(file);
    mapdata = JSON.parse(model_data);
    model_features = topojson.feature(mapdata, mapdata.objects.model_features).features;

    jsdom.env("<svg></svg>", scripts, function(errors, window) {
        for (var o in outputs) {
            var output = outputs[o];
            var d3 = window.d3,
                svg = d3.select("svg");
            svg.attr("width", width)
                .attr("height", height);
            var path = d3.geo.path().projection(null);
            var layerGroup = svg.append("g");
            var modelFeatures = layerGroup.append("g");

            // create layer groups for layers that don't contain model features
            for (var l in mapdata.objects) {
                if (l == 'model_features') continue;
                var layer = mapdata.objects[l];
                var data = topojson.feature(mapdata, layer).features;
                var lg = layerGroup.append("g");
                lg.selectAll('.' + l)
                    .data(data)
                    .enter()
                    .append("path")
                    .attr("class", function(d) {
                        var style = '';
                        if (d.properties.hasOwnProperty('Style')) {
                            style = d.properties.Style.replace(/ /g, '_').toLowerCase();
                        }
                        return l + ' ' + style;
                    })
                    .attr("d", path);
            }

            // model features
            modelFeatures.selectAll(".feature")
                .data(model_features)
                .enter().append("path")
                .attr("id", function(d) {
                    return d.properties.id;
                })
                .attr("class", function(d) {
                    // TODO needs to be generalized
                    var cls = d.properties.id == null ? 'nodata' : 'data';
                    return sprintf("feature %s", cls);
                })
                .style("fill", function(d) {
                     return config.output_minimap_colors[output];    
                })
                .attr("d", path);

            var node = svg.node();
            if (node instanceof window.d3.selection) {
                node = node.node();
            }
            // set the xmlns attribute on the root node
            node.setAttribute("xmlns", "http://www.w3.org/2000/svg");

            _applyStyles(svg, styles);

            var filename = output + '.svg';
            svgs.push(filename);
            fs.writeFileSync(filename, node.outerHTML);
        }
        d.resolve(svgs);
    });
    return d.promise;
}

module.exports = generate;
