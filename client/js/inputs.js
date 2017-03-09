var sprintf = require('sprintf'),
    $ = require('jquery'),
    Q = require('q'),
    topojson = require('topojson'),
    science = require('science'),
    d3 = require('d3');

var inputs = {};

var _config = {};

inputs.getSliders = function(inputConfig) {
    // clear inputs before redrawing
    $('#inputs').empty();
    $.each(inputConfig, function(idx, input) {

        var data = input.distribution;

        // add a margin of 0.1 m,M
        var m1 = data[0] - (data[0] * 0.1)
        var m2 = data[data.length -1] + (data[data.length -1] * 0.1)
        data.unshift(m1);
        data.push(m2);

        var bounds = d3.extent(data);

        var margin = {
            top: 5,
            right: 1,
            bottom: 0,
            left: 1
        }

        var width = 120 - margin.left - margin.right,
            height = 30 - margin.top - margin.bottom;

        var kde = science.stats.kde().sample(data);

        var bw = kde.bandwidth(science.stats.bandwidth.nrd0)(data);

        var x = d3.scale.linear()
            .domain(bounds)
            .range([0, width]);

        var y = d3.scale.linear()
            .domain([0, d3.max(bw, function(d) {
                return d[1];
            })])
            .range([height, 0]);

        // gaussian curve
        var l = d3.svg.line()
            .x(function(d) {
                return x(d[0]);
            })
            .y(function(d) {
                return y(d[1]);
            })
            .interpolate("basis");

        // area under gaussian curve
        var a = d3.svg.area()
            .x(function(d) {
                return x(d[0]);
            })
            .y0(height)
            .y1(function(d) {
                return y(d[1]);
            });

        // bisect data array at brush selection point
        b = d3.bisector(function(d) {
            return d;
        }).left;

        var div = d3.select('#inputs')
            .append("div")
            .attr('class', 'input-row');

        var tr = div.append("table")
            .attr('width', '100%')
            .attr('class', 'table table-responsive')
            .attr("id", "table-" + input.key)
            .style('pointer-events', 'none')
            .append("tr")
            .style('pointer-events', 'none');

        tr.append("td")
            .attr('width', '55%')
            .append('span')
            .attr("class", "descriptor")
            .style('pointer-events', 'all')
            .text(input.descriptor);

        tr.append("td")
            .attr('width', '15%')
            .append('span')
            .attr("class", "value")
            .style('pointer-events', 'none')
            .text(' ');

        var td = tr.append("td")
            .attr('width', '30%')
            .style('pointer-events', 'none');

        var svg = td.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", input.key)
            .style('pointer-events', 'all')
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // add gaussian curve
        var gaus = svg.append("g")
            .attr("id", input.key)
            .attr("class", "gaussian");

        gaus.selectAll("g#" + input.key + " .gaussian")
            // Multivariant Density Estimation
            // http://bit.ly/1Y3jEcD
            .data([science.stats.bandwidth.nrd0])
            .enter()
            .append("path")
            .attr("d", function(d) {
                return l(kde.bandwidth(d)(data));
            });

        // add gaussian curve
        var area = svg.append("g")
            .attr("id", 'area-' + input.key)
            .attr("class", "area");

        area.selectAll("g#area-" + input.key + " .area")
            .data([science.stats.bandwidth.nrd0])
            .enter()
            .append("path")
            .attr("d", function(d) {
                var dd = kde.bandwidth(d)(data);
                return a(dd);
            });

        var mask = svg.append("g")
            .attr("id", 'mask-' + input.key)
            .attr("class", "mask");

        // add placeholder for initial model value
        var initial = svg.append("g")
            .attr("id", 'initial-' + input.key)
            .attr("class", "initial")
            .append('line');

        var brush = d3.svg.brush()
            .x(x)
            .extent([0, d3.mean(data)])
            .on("brushstart", brushstart)
            .on("brush", brushmove)
            .on("brushend", brushend);

        // add the brush to the input config so
        // we can access it later
        input.brush = brush;
        input.x = x;
        input.width = width;
        input.height = height;
        _config[input.key] = input;


        var line = d3.svg.line()
            .x(function(d) {
                return brush.extent()[1];
            })
            .y(function(d) {
                return height;
            });

        var brushg = svg.append("g")
            .attr("class", "brush")
            .call(brush);


        brushg.call(brush.event)
            .transition()
            .duration(750)
            .call(brush.extent([0, d3.mean(data)]))
            .call(brush.event);

        brushg.selectAll("g.resize.w").remove();

        brushg.select("#" + input.key + " g.resize.e").append("path")
            .attr("d", line);

        brushg.selectAll("rect")
            .attr("height", height);

        function brushstart() {
            svg.classed("selecting", true);
        }

        function brushmove() {
            // clear existing mask
            $('#mask-' + input.key).empty();
            var s = brush.extent();
            var clip = b(data, s[1]);
            var selected = data.slice(0, clip);
            selected.push(s[1]);
            mask.selectAll("g#mask-" + input.key + " .mask")
                .data([science.stats.bandwidth.nrd0])
                .enter()
                .append("path")
                .attr("d", function(d) {
                    return a(kde.bandwidth(d)(selected));
                });
            d3.select("#" + input.key + " g.resize.e path")
                .attr("d", 'M 0, 0 ' + ' L 0 ' + height);
            var span = $("#table-" + input.key + ' span.value');
            span.empty();
            span.html(function() {
                var percent = input.number_type == ('percent' || 'small_percent') ? ' %' : '';
                var ext = +input.brush.extent()[1];
                if (percent != '') {
                    ext = +input.brush.extent()[1] * 100;
                    return ext.toFixed(1) + percent;
                }
                return ext.toFixed(3);
            });
        }

        function brushend() {
            if (d3.event.sourceEvent) {
                // source is a MouseEvent
                // user is updating the input manually
                var node = d3.select(d3.event.sourceEvent.target).node();
                var s = $(node).closest('svg');
                var id = $(s).attr('id');
                // redraw the input plot
                if (id) {
                    inputs.redrawInputPlot(id);
                } else {
                    console.warn('Cant get input id from:' + node);
                }
            }
            svg.classed("selecting", !d3.event.target.empty());
        }
    });
}


// redraw the input plot based on user slider changes
inputs.redrawInputPlot = function(key) {
    var config = inputs.getConfig();
    var input = config[key];
    $.event.trigger({
        type: 'inputchanged',
        input: input
    });
}

/*
 * Update input extents when feature selected
 * on either map or output plot
 */
inputs.update = function(model, initial) {
    var config = inputs.getConfig();
    for (var conf in config) {
        if (config.hasOwnProperty(conf)) {
            var ini = d3.select('svg#' + conf + ' g.initial line');
            // remove existing initial marker
            //ini.select('line').remove();
            var input = config[conf];
            ini.attr("x1", function(d) {
                    return input.x(+initial[conf]);
                })
                .attr('y1', 0)
                .attr('x2', function(d) {
                    return input.x(+initial[conf]);
                })
                .attr('y2', input.height);
            // get the input config

            var brush = input.brush;
            // get the value of the current input from the model
            // and update the brush extent
            var extent = +model[conf];
            brush.extent([0, extent]);
            var brushg = d3.selectAll('#inputs svg#' + conf + ' g.brush');
            brushg.transition()
                .duration(750)
                .call(brush)
                .call(brush.event);
        }
        // remove w resize extent handle
        d3.selectAll("g.brush > g.resize.w").remove();
    }
}

inputs.getConfig = function() {
    return _config;
}

// get current extents from input sliders
inputs.getInputValues = function() {
    var params = {};
    var config = inputs.getConfig();
    for (var conf in config) {
        if (config.hasOwnProperty(conf)) {
            // get the input config
            var input = config[conf];
            var brush = input.brush;
            var extent = +brush.extent()[1].toFixed(5);
            params[conf] = extent;
        }
    }
    return params;
}

/*
 * Handle feature selection events.
 */
inputs.featureselect = function(feature, model, initialModel) {
    var props = feature.properties;
    var id = props.id;
    var initial = initialModel[id];
    $('span#selected-feature').html(props.name);
    inputs.update(model, initial);
}

module.exports = inputs;
