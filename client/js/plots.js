var d3 = require('d3'),
    Q = require('q'),
    $ = require('jquery')
    inputs = require('./inputs');

var margin = {
        top: 20,
        right: 10,
        bottom: 20,
        left: 50
    },
    width = 500 - margin.left - margin.right,
    height = 370 - margin.top - margin.bottom;


var plots = {};

plots.appConfig = {};

plots.current_input = {};

/*
 * Draws the output plot using the provided config.
 */
plots.output = function(config) {

    // keep a reference to the currently selected feature
    var selected = d3.select('#output-plot .featureselect');

    // clear plot before redrawing
    $('#output-plot svg').empty();
    $('#output-bubble-title').html(config.chloropleth_title);

    var domain = [];

    $.each(plots.model, function(idx, data) {
        if (data[config.chloropleth_field]) {
            var obj = {};
            obj['name'] = data['name'];
            obj['id'] = data['id'];
            obj['pop'] = +data[plots.appConfig.pop];
            obj['gdp_pc_pp'] = +data[plots.appConfig.gdp];
            var val = +data[config.chloropleth_field];
            obj[config.chloropleth_field] = val * 100;
            domain.push(obj);
        }
    });

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category10();

    var svg = d3.select("#output-plot svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "bubble");

    // x and y domains should be set via config file
    x.domain(d3.extent(domain, function(d) {
        return d.gdp_pc_pp; // should be configurable
    })).nice();
    y.domain(d3.extent(domain, function(d) {
        return d[config.chloropleth_field];
    })).nice();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);

    svg.selectAll(".dot")
        .data(domain)
        .enter().append("circle")
        .attr("class", function(d) {
            return "dot " + d.id;
        })
        .attr("r", function(d) {
            return Math.floor(Math.log(d.pop));
        })
        .attr("cx", function(d) {
            return x(+d.gdp_pc_pp);
        })
        .attr("cy", function(d) {
            return y(d[config.chloropleth_field]);
        })
        .style("fill", function(d) {
            //return color(d.pop);
            return "steelblue";
        })
        .style("opacity", '.5')
        .on('mousedown', function(d) {
            // notify event listeners
            $.event.trigger({
                type: 'plotselect',
                source: 'output-plot',
                feature: d
            })
        })
        .append("title")
        .text(function(d) {
            return d.name + ", Pop:" + d.pop;
        });

    if (!selected.empty()) {
        var sel = d3.select('.dot.' + selected.datum().id);
        sel.attr("class", "dot " + selected.datum().id + " featureselect");
    }

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width - 20)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("GDP");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(config.chloropleth_title)
}

plots.input = function(input, selectedFeature, initialModel) {
    // clear plot before redrawing
    $('#input-plot svg').empty();

    var domain = [];

    $.each(plots.model, function(idx, data) {
        var obj = {};
        obj['name'] = data['name'];
        obj['id'] = data['id']
        obj['pop'] = +data[plots.appConfig.pop];
        obj['gdp_pc_pp'] = +data[plots.appConfig.gdp];
        var val = data[input.key];
        if (selectedFeature) {
            if (data.id == selectedFeature.properties.id) {
                var extent = +input.brush.extent()[1].toFixed(5);
                obj[input.key] = extent;
                domain.push(obj);
            }
            else {
                if (input.lower == 0 && input.upper == 0){
                    obj[input.key] = val;
                    domain.push(obj);
                }
                else if (val > input.upper){
                    obj[input.key] = input.upper;
                    domain.push(obj);
                }
                else {
                    obj[input.key] = val;
                    domain.push(obj);
                }
            }
        }
        else {
            if (input.lower == 0 && input.upper == 0){
                obj[input.key] = val;
                domain.push(obj);
            }
            else if (val > input.upper){
                obj[input.key] = input.upper;
                domain.push(obj);
            }
            else {
                obj[input.key] = val;
                domain.push(obj);
            }
        }
    });

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);

    var svg = d3.select("#input-plot svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "bubble");

    // get currently selected bubble if any
    var selected = d3.select('circle.featureselect');

    svg.selectAll("g").remove();
    svg.selectAll('circle').remove();

    domain.forEach(function(d) {
        d.gdp_pc_pp = +d.gdp_pc_pp;
        var val = +d[input.key];
        if (input.number_type == 'percent'){
            val *= 100;
        }
        d[input.key] = val;
        d.pop = +d.pop;
    });

    // x and y domains should be set via config file
    x.domain(d3.extent(domain, function(d) {
        return d.gdp_pc_pp;
    })).nice();
    y.domain(d3.extent(domain, function(d) {
        return d[input.key];
    })).nice();

    svg.selectAll(".dot")
        .data(domain)
        .enter().append("circle")
        .attr("class", function(d) {
            return "dot " + d.id;
        })
        .attr("r", function(d) {
            return Math.floor(Math.log(d.pop));
        })
        .attr("cx", function(d) {
            return x(d.gdp_pc_pp);
        })
        .attr("cy", function(d) {
            return y(d[input.key]);
        })
        .style("fill", function(d) {
            //return color(d.pop);
            return "steelblue";
        })
        .style("opacity", '.5')
        .on('mousedown', function(d) {
            // notify event listeners
            $.event.trigger({
                type: 'plotselect',
                source: 'input-plot',
                feature: d
            })
        })
        .append("title")
        .text(function(d) {
            return d.name + ", Pop: " + Math.floor(d.pop);
        });

    var title = input.descriptor;
    $('#input-bubble-title').html(title);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width - 20)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("GDP");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(input.descriptor);

}

// handle feature selection
plots.featureselect = function(feature, model,
    initialModel, inputConfig, output) {
    var id = feature.properties.id;
    var initial = initialModel[id];
    // reset input plot
    plots.input(inputConfig, feature, initial);
    // select features on plots
    _selectBubble(feature, 'output-plot', initialModel, output);
    _selectBubble(feature, 'input-plot', initialModel, inputConfig.key);
}

// update plots on map selection change
plots.mapselect = function(feature, map_config, initialModel, input, output) {
    plots.output(map_config);
    _selectBubble(feature, 'output-plot', initialModel, output);
    _selectBubble(feature, 'input-plot', initialModel, input);
}

// redraw the input scatterplot when an input is changed by the user
plots.inputchanged = function(input, selectedFeature, initialModel) {
    var id = selectedFeature.properties.id;
    var initial = initialModel[id];
    // redraw the plot based on the current input
    plots.input(input, selectedFeature, initial);
    plots.curent_input = input;
    _selectBubble(selectedFeature, 'input-plot', initialModel, input.key);
}

// handle selection events on either of the plots
plots.plotselect = function(feature, source, initialModel, input, output) {
    _selectBubble(feature, 'output-plot', initialModel, output);
    _selectBubble(feature, 'input-plot', initialModel, input);
}


// select a bubble on one of the plots
_selectBubble = function(feature, source, initialModel, key) {

    var id = feature.properties.id;
    var initial = initialModel[id];
    var p = d3.select('#' + source + ' svg');
    p.selectAll('circle.dot')
        .classed('featureselect', false);
    var s1 = p.select('circle.dot.' + id).classed('featureselect', true);
    n = s1.node();
    d = s1.datum();

    if (initial) {
        p.selectAll('circle.initial').remove();
        var x = d3.scale.linear()
            .range([0, width]);
        var y = d3.scale.linear()
            .range([height, 0]);
        var domain = _getDomain(plots.initialModel, source, key);
        x.domain(d3.extent(domain, function(d) {
            return d.gdp_pc_pp;
        })).nice();
        y.domain(d3.extent(domain, function(d) {
            return d[key] * 100;
        })).nice();

        p.append('circle')
            .attr('class', function() {
                return 'initial ' + initial.id;
            })
            .attr("r", function() {
                return Math.floor(Math.log(initial[plots.appConfig.pop]));
            })
            .attr("cx", function() {
                return x(initial[plots.appConfig.gdp]);
            })
            .attr("cy", function() {
                return y(initial[key] * 100);
            })
            .style({
                'fill': 'lightgrey',
                'stroke-width': '2px',
                'stroke': 'darkgrey'
            })
            .style("opacity", '1');
    }

    var s2 = d3.select(n.parentNode.appendChild(
        n.cloneNode(true), n.nextSibling));

    s2.datum(d)
        .on('mousedown', function(d) {
            $.event.trigger({
                type: 'plotselect',
                source: source,
                feature: d
            })
        })

    s1.remove();
}

_getDomain = function(initialModel, source, key) {
    var domain = [];
    if (source == 'output-plot'){
        for (var model in initialModel) {
            var obj = {};
            m = initialModel[model];
            obj.id = m.id;
            var val = +m[key];
            obj[key] = val;
            obj.gdp_pc_pp = +m[plots.appConfig.gdp];
            obj.pop = +m[plots.appConfig.pop];
            domain.push(obj);
        }
    }
    else {
        var input = inputs.getConfig()[key];
        for (var model in initialModel) {
            m = initialModel[model];
            var obj = {};
            obj.id = m.id;
            obj.gdp_pc_pp = +m[plots.appConfig.gdp];
            obj.pop = +m[plots.appConfig.gdp];
            var val = +m[key];
            if(input.lower == 0 && input.upper == 0){
                obj[key] = val;
            }
            else if (val > input.upper){
                obj[key] = input.upper;
            }
            else {
                obj[key] = val;
            }
            domain.push(obj);
        }
    }
    return domain;
}


module.exports = plots;
