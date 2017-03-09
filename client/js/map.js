var $ = require('jquery'),
    sprintf = require('sprintf'),
    Q = require('q'),
    d3 = require('d3'),
    inputs = require('./inputs'),
    topojson = require('topojson');
require('d3-geo-projection')(d3);

var map = {};

map.config = {}

map.outputs = {};

map.draw = function(config, json, model_data) {

    // clear the map before redrawing
    $('#map').empty();
    $('#map').append('<div id="data"></div>');

    // update the map config
    map.config = config;
    var d = Q.defer();
    var width = config.width;
    var height = config.height;
    svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var layerGroup = svg.append("g");

    var modelFeatures = layerGroup.append("g");

    var path = d3.geo.path().projection(null);

    // create layer groups for layers that don't contain model features
    for (var l in json.objects){
        if (l == 'model_features') continue;
        var layer = json.objects[l];
        var data = topojson.feature(json, layer).features;
        var lg = layerGroup.append("g");
        lg.selectAll('.' + l)
            .data(data)
            .enter()
            .append("path")
            .attr("class", function(d) {
                var style = '';
                if (d.properties.hasOwnProperty('Style')){
                    style = d.properties.Style.replace(/ /g, '_').toLowerCase();
                }
                return l + ' ' + style;
            })
            .attr("d", path);
    }

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 20])
        .on("zoom", zoomed);

    svg.call(zoom).call(zoom.event);

    function zoomed() {
        var t = d3.event.translate,
            s = d3.event.scale,
            h = height;
        w = width;
        t[0] = Math.min(w / 2 * (s - 1) + (w / 2 * s), Math.max(w / 2 * (1 - s) - (w / 2 * s), t[0]));
        t[1] = Math.min(h / 3 * (s - 1) + (h / 3 * s), Math.max(h / 3 * (1 - s) - (h / 3 * s), t[1]));
        layerGroup.attr("transform", "translate(" + t + ") scale(" + s + ")");
    }

    // pull out the model features
    var model_features = topojson.feature(json,  json.objects.model_features).features;

    // model features
    modelFeatures.selectAll(".feature")
        .data(model_features)
        .enter()
        .append("path")
        .attr("id", function(d){
            return d.properties.id;
        })
        .attr("class", function(d) {
            var id = d.properties.id;
            var model = model_data[id];
            if (model){
                return sprintf("feature data %s", id);
            }
            else {
                return "feature nodata";
            }
        })
        .attr("d", path)
        .on('mouseout', function(d) {
            $.event.trigger({
                type: 'display-output-data',
                config: map.config
            });
        })
        .on('mouseover', function(d) {
            var name = d.properties.name;
            var id = d.properties.id;
            if (name) {
                var chl_field = +model_data[id][map.config.chloropleth_field];
                var id = d.properties.id;
                $('#data').empty();
                $('#data').append('<span><strong>' + name + ' </strong></span>');
                var output = map.outputs[map.config.chloropleth_field];
                var percent = output.number_type == ('percent') ? ' %' : '';
                var precision = +output.precision;
                $('#data').append('<span>' + (+chl_field * 100).toFixed(precision) +  percent + '</span>');
            }
        })
        .on('mousedown', function(d) {
            // don't select countries if we don't have id code
            if (!d.properties.id) {
                return;
            }
            // clear selection before re-selecting
            modelFeatures.selectAll('.feature')
                .classed('featureselect', false);

            // select the feature
            var id = d.properties.id;
            modelFeatures.selectAll('.' + id)
                .classed('featureselect', true);

            // notify event listeners
            $.event.trigger({
                type: 'featureselect',
                feature: d
            });
        });

    // get input domains
    d.resolve(model_features);

    return d.promise;
}

// set selected feature
map.featureselect = function(feature, model) {
    // clear selection before re-selecting
    svg.selectAll('.feature')
        .classed('featureselect', false);

    // select the feature
    var name = feature.properties.name;
    var id = feature.properties.id;
    svg.selectAll('.' + id)
        .classed('featureselect', true);

    var chl_field = +model[map.config.chloropleth_field];
    $('#data').empty();
    $('#data').append('<span><strong>' + name + ' </strong></span>');
    var output = map.outputs[map.config.chloropleth_field];
    var percent = output.number_type == ('percent') ? ' %' : '';
    var precision = +output.precision;
    $('#data').append('<span>' + (+chl_field * 100).toFixed(precision) +  percent + '</span>');
}

// handle output map switch events
map.mapselect = function(feature, model) {
    var name = feature.properties.name;
    var id = feature.properties.id;
    var chl_field = +model[map.config.chloropleth_field];
    $('#data').empty();
    $('#data').append('<span><strong>' + name + ' </strong></span>');
    var output = map.outputs[map.config.chloropleth_field];
    var percent = output.number_type == ('percent') ? ' %' : '';
    var precision = +output.precision;
    $('#data').append('<span>' + (+chl_field * 100).toFixed(precision) +  percent + '</span>');
}

module.exports = map;
