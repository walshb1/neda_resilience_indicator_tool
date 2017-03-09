var mapshaper = require('mapshaper'),
    sprintf = require('sprintf'),
    fs = require('fs-extra'),
    path = require('path'),
    exec = require('child_process').exec,
    Q = require('q');

var generate = {};

/*
 * Generate topojson with merged model data.
 */
generate.model_features = function(config) {
    var layerConfig = config.layers['model_features'];
    var msCmd = sprintf('-i name=%(layer_name)s %(shape_file)s auto-snap -simplify %(simplify)s -filter-fields %(filter_fields)s -join %(data)s  keys=%(shp_join_field)s:str,%(data_join_field)s:str -rename-fields %(rename_fields)s -o force model_features.topojson', {
        layer_name: layerConfig.layer_name,
        shape_file: layerConfig.shape_file,
        simplify: config.map.simplify_poly,
        filter_fields: layerConfig.filter_fields,
        data: config.inputs.data,
        shp_join_field: layerConfig.shp_join_field,
        data_join_field: layerConfig.data_join_field,
        rename_fields: layerConfig.rename_fields
    });
    var d = Q.defer();
    mapshaper.runCommands(msCmd, function() {
        console.log('Created model_features topojson');
        d.resolve({
            'model_features': 'model_features.topojson'
        })
    });
    return d.promise;
}

/*
 *  Generate topojson without merging model data.
 */
generate.plain_features = function(config) {
    var layerConfig = config.layers['model_features'];
    var msCmd = sprintf('-i name=%(layer_name)s %(shape_file)s auto-snap -simplify %(simplify)s -filter-fields %(filter_fields)s -rename-fields %(rename_fields)s -o force model_features.topojson', {
        layer_name: layerConfig.layer_name,
        shape_file: layerConfig.shape_file,
        simplify: config.map.simplify_poly,
        filter_fields: layerConfig.filter_fields,
        rename_fields: layerConfig.rename_fields
    });
    var d = Q.defer();
    mapshaper.runCommands(msCmd, function() {
        console.log('Created model_features topojson (no data merge)');
        d.resolve({
            'model_features': 'model_features.topojson'
        });
    });
    return d.promise;
}

// additional layers

generate.coastlines = function(config) {
    var layerConfig = config.layers['coastlines'];
    var coastLineCmd = sprintf('-i name=%(layer_name)s %(shape_file)s auto-snap -simplify %(simplify)s -o force drop-table coastlines.topojson', {
        layer_name: layerConfig.layer_name,
        shape_file: layerConfig.shape_file,
        simplify: config.map.simplify_line
    });
    var d = Q.defer();
    mapshaper.runCommands(coastLineCmd, function() {
        console.log('Created coastline topojson');
        d.resolve({
            'coastlines': 'coastlines.topojson'
        });
    });
    return d.promise;
}

generate.international_boundaries = function(config) {
    var layerConfig = config.layers['international_boundaries'];
    // international boundaries topojson command
    var intlBdiesCmd = sprintf('-i name=%(layer_name)s %(shape_file)s  -simplify %(simplify)s -filter-fields %(filter_fields)s -o force drop-table international_boundaries.topojson', {
        layer_name: layerConfig.layer_name,
        shape_file: layerConfig.shape_file,
        simplify: config.map.simplify_line,
        filter_fields: layerConfig.filter_fields
    });
    var d = Q.defer();
    mapshaper.runCommands(intlBdiesCmd, function() {
        console.log('Created international boundaries topojson');
        d.resolve({
            'international_boundaries': 'international_boundaries.topojson'
        });
    });
    return d.promise;
}

generate.disputed_areas = function(config) {
    var layerConfig = config.layers['disputed_areas'];
    // disputed areas topojson command
    var dispAreasCmd = sprintf('-i name=%(layer_name)s %(shape_file)s -simplify %(simplify)s -filter-fields %(filter_fields)s -o force disputed_areas.topojson', {
            layer_name: layerConfig.layer_name,
            shape_file: layerConfig.shape_file,
            simplify: config.map.simplify_line,
            filter_fields: layerConfig.filter_fields
        })
        //console.log(dispAreasCmd);
    var d = Q.defer();
    mapshaper.runCommands(dispAreasCmd, function() {
        console.log('Created disputed areas topojson');
        d.resolve({
            'disputed_areas': 'disputed_areas.topojson'
        });
    });
    return d.promise;
}

generate.disputed_boundaries = function(config) {
    var layerConfig = config.layers['disputed_boundaries'];
    // disputed boundaries topojson command
    var dispBdiesCmd = sprintf('-i name=%(layer_name)s %(shape_file)s -simplify %(simplify)s -filter-fields %(filter_fields)s -o force disputed_boundaries.topojson', {
        layer_name: layerConfig.layer_name,
        shape_file: layerConfig.shape_file,
        simplify: config.map.simplify_line,
        filter_fields: layerConfig.filter_fields
    });
    //console.log(dispBdiesCmd);
    var d = Q.defer();
    mapshaper.runCommands(dispBdiesCmd, function() {
        console.log('Created disputed boundaries topojson');
        d.resolve({
            'disputed_boundaries': 'disputed_boundaries.topojson'
        });
    });
    return d.promise;
}

// generate all layers
generate.all = function(config, merge_model) {
    var files = {}; // return map of layers to files
    var d = Q.defer();
    // generate array of layer functions
    var layers = [];
    for (var l in config.layers){
        var layer = config.layers[l];
        var layer_name = layer.layer_name;
        if ((layer_name == 'model_features') && (merge_model == false)){
            layers.push(generate['plain_features']);
        }
        else{
            layers.push(generate[layer_name]);
        }
    }
    // run all layer functions in parallel and combine results
    Q.all(layers.map(function(layer) {
        return layer(config);
    })).done(
        function(values) {
            // combine files topojson command
            values.map(function(item) {
                var key = Object.keys(item)[0];
                files[key] = item[key];
            });
            const filenames = Object.keys(files).map(key => files[key]);

            // combine topojson layers into one file
            var combineCmd = '-i combine-files ' + filenames.join(' ') + ' -o force temp.topojson';
            mapshaper.runCommands(combineCmd, function() {
                var width = config.map.width;
                var height = config.map.height;
                var margin = config.map.margin;
                var projection = config.map.projection;
                var topoCmd = sprintf("topojson -p --width %(width)s --height %(height)s --margin %(margin)s --projection '%(projection)s' -o map_data.topojson temp.topojson", {
                    width: width,
                    height: height,
                    margin: margin,
                    projection: projection
                });
                // generate the final result, reprojected and resized
                exec(topoCmd, function(err, stdout, stderr) {
                    if (err) return console.log(err);
                    d.resolve({'map_data': 'map_data.topojson'});
                    console.log('Created map_data.topojson');
                });
            });
        });
    return d.promise;
}

module.exports = generate;
