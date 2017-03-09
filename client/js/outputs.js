var sprintf = require('sprintf'),
    $ = require('jquery'),
    Q = require('q'),
    topojson = require('topojson'),
    science = require('science'),
    d3 = require('d3');

var outputs = {};

outputs.domains = {};

outputs.getOutputDistributions = function(outputDomains) {

    $('#outputs').empty();
    //  keep a reference to the output domains
    outputs.domains = outputDomains;

    $.each(outputDomains, function(idx, output) {

        var s1 = output.gradient[0],
            s2 = output.gradient[1];

        // sort the distribution
        var data = output.domain.sort(function(a, b) {
            return a - b;
        });

        bounds = d3.extent(data);

        var margin = {
                top: 5,
                right: 2,
                bottom: 0,
                left: 2
            },
            width = 120 - margin.left - margin.right,
            height = 30 - margin.top - margin.bottom;

        var kde = science.stats.kde().sample(data);

        var bw = kde.bandwidth(science.stats.bandwidth.nrd0)(data);

        var x = d3.scale.linear()
            .domain(bounds)
            .range([0, width])
            .clamp(true);

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
            });

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

        var div = d3.select('#outputs')
            .append("div")
            .attr("id", idx)
            .attr('class', 'col-sm-4')
            .attr('data-output', idx)
            .attr('data-output-title', output.descriptor)
            .style('pointer-events', 'all')
            .on('click', function() {
                var chloropleth_field = this.getAttribute('data-output'),
                    chloropleth_title = this.getAttribute('data-output-title');
                $.event.trigger({
                    type: 'mapselect',
                    chloropleth_field: chloropleth_field,
                    chloropleth_title: chloropleth_title
                });
            });

        var table = div.append("table")
            .attr('width', '100%')
            .attr('class', 'table table-responsive')
            .attr("id", "table-" + idx)
        var tr = table.append('tr');

        var td = tr.append("td")
            .attr('width', '100%');
        var svg = td.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", idx)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")")
            .style("pointer-events", "none")
            .style("border-bottom", "1px solid lightgrey");

        var gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "gradient-" + idx)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");
        //.attr("spreadMethod", "pad");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", s1)
            .attr("stop-opacity", 1);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", s2)
            .attr("stop-opacity", 1);

        var tr = table.append("tr");
        tr.append("td")
            .attr('width', '100%')
            .append('span')
            .attr("class", "descriptor")
            .text(output.descriptor + ':');


        // add gaussian curve
        var gaus = svg.append("g")
            .attr("id", idx)
            .attr("class", "gaussian");

        gaus.selectAll("g#" + idx + " .gaussian")
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
            .attr("id", 'area-' + idx)
            .attr("class", "area");

        area.selectAll("g#area-" + idx + " .area")
            .data([science.stats.bandwidth.nrd0])
            .enter()
            .append("path")
            .attr("d", function(d) {
                return a(kde.bandwidth(d)(data));
            })
            .style("fill", "url(#gradient-" + idx + ")");

        // add placeholder for initial model value
        var initial = svg.append("g")
            .attr("id", 'initial-' + idx)
            .attr("class", "initial")
            .append('line');

        var brush = d3.svg.brush()
            .x(x)
            .extent([0, d3.mean(data)])
            .on("brushstart", brushstart)
            .on("brush", brushmove)
            .on("brushend", brushend);

        table.append("tr")
            .append("td")
            .attr('width', '100%')
            .append('span')
            .attr("class", "output-value")
            .text(function(){
                var percent = output.number_type == ('percent') ? ' %' : '';
                var precision = +output.precision;
                return (+brush.extent()[1] * 100).toFixed(precision) +  percent;
            });

        // keep a reference to the brush for the output domain
        outputs.domains[idx].brush = brush;
        outputs.domains[idx].x = x;
        outputs.domains[idx].height = height;

        var line = d3.svg.line()
            .x(function(d) {
                return d3.mean(data);
            })
            .y(function(d) {
                return height;
            });

        var brushg = svg.append("g")
            .attr("class", "brush")
            .style("pointer-events", "none")
            .call(brush);

        brushg.call(brush.event)
            .transition()
            .duration(750)
            .call(brush.extent([0, d3.mean(data)]))
            .call(brush.event);

        brushg.selectAll("g.resize.w").remove();

        brushg.select("#" + idx + " g.resize.e").append("path")
            .attr("d", line)
            .style("pointer-events", "none");

        brushg.selectAll("rect")
            .attr("height", height)
            .style("pointer-events", "none");

        function brushstart() {
            svg.classed("selecting-output", true);
        }

        function brushmove() {
            d3.select("#" + idx + " g.resize.e path")
                .attr("d", 'M 0, 0 ' + ' L 0 ' + height);
        }

        function brushend() {
            svg.classed("selecting", !d3.event.target.empty());
        }
    });
}


/*
 * Update output extents when feature selected
 * on either map or output plot
 */
outputs.update = function(model, initial) {
    var domains = outputs.domains;
    for (var domain in domains) {
        if (domains.hasOwnProperty(domain)) {
            var ini = d3.select('svg#' + domain + ' g.initial line');
            var x = domains[domain].x;
            var height = domains[domain].height;
            ini.attr("x1", function(d){
                    return x(+initial[domain]);
                })
                .attr('y1', 0)
                .attr('x2', function(d){
                    return x(+initial[domain]);
                })
                .attr('y2', height);
            // get the input config
            var brush = domains[domain].brush;
            // get the value of the current input from the model
            // and update the brush extent
            var extent = +model[domain];
            brush.extent([0, extent]);
            var output = domains[domain];
            var percent = output.number_type == ('percent') ? ' %' : '';
            var precision = +output.precision;
            $('#outputs #' + domain + ' .output-value').html((brush.extent()[1] * 100).toFixed(precision) + percent);
            var brushg = d3.selectAll('#outputs svg#' + domain + ' g.brush');
            brushg.transition()
                .duration(750)
                .call(brush)
                .call(brush.event);
        }
        // remove w resize extent handle
        d3.selectAll("g.brush > g.resize.w").remove();
    }
}


/*
 * Handle feature selection events.
 */
outputs.featureselect = function(feature, model, initialModel) {
    var props = feature.properties;
    var id = props.id;
    var initial = initialModel[id];
    //$('span#selected-feature').html(props.name);
    outputs.update(model, initial);
}

module.exports = outputs;
