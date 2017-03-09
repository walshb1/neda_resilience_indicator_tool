var sprintf = require('sprintf');
var Q = require('q');
var d3 = require('d3');
var colorbrewer = require('colorbrewer');

var styles = {};

styles.applyDefaults = function() {

    // get the map
    var svg = d3.select("#map");

    // nodata info
    svg.selectAll(".nodata")
        .style('fill', '#ccc')
        // .style('stroke', '#666')
        // .style('stroke-width', '.5')
        // .style('stroke-linejoin', 'miter')
        .on('mouseover', function(d) {
            $('#data').empty();
            $('#data').append('<span><strong>No data</strong></span>');
        });

    svg.selectAll('.coastlines')
        .style('fill', 'none')
        .style('stroke', '#666')
        .style('stroke-width', '.2px')
        .style('stroke-linejoin', 'miter');

    svg.selectAll('.international_boundaries')
        .style('fill', 'none')
        .style('stroke', '#666')
        .style('stroke-width', '.2px')
        .style('stroke-linejoin', 'miter');

    svg.selectAll('.disputed_boundaries')
        .style('fill', 'none');

    svg.selectAll('.disputed_areas')
        .style('fill', '#E0E0E0');

    svg.selectAll('.dotted_line')
        .style('fill', 'none')
        .style('stroke', '#666')
        .style('stroke-width', '.2px')
        .style('stroke-dasharray', '.1, .8')
        .style('stroke-linecap', 'round');

    svg.selectAll('.dashed_line')
        .style('fill', 'none')
        .style('stroke', '#666')
        .style('stroke-width', '.2px')
        .style('stroke-dasharray', '.8, .8')
        .style('stroke-linejoin', 'miter');

    svg.selectAll('.tightly_dashed_line')
        .style('fill', 'none')
        .style('stroke', '#666')
        .style('stroke-width', '.2px')
        .style('stroke-dasharray', '1.5, .5')
        .style('stroke-linejoin', 'miter');
}

styles.computeStyles = function(colorScale, model_data, chloropleth_field) {

    var svg = d3.select("#map");

    svg.selectAll(".feature")
        .style("fill", function(d) {
            // map resilience output by default
            var model = model_data[d.properties.id];
            if(model){
                var value = model[chloropleth_field];
                var color = styles.chloropleth(colorScale, value);
                return color;
            }
        });
}

styles.colorScale = function(domain, data) {

    var d = data.domain.sort(function(a, b) {
        return a - b;
    });

    var OrRd = colorbrewer.OrRd[5];
    var BuPu = colorbrewer.BuPu[5];
    var GnBu = colorbrewer.GnBu[5];

    var RdOr = OrRd.slice(0).reverse();

    color_ranges = {
        'resilience': RdOr,
        'risk': BuPu,
        'risk_to_assets': GnBu
    }

    //create quantile classes with color scale
    var colors = d3.scale.quantile()
        .domain(d)
        .range(color_ranges[domain]);

    return colors; //return the color scale generator
};

styles.chloropleth = function choropleth(computeStyles, value) {
    //if value exists, assign it a color; otherwise assign gray
    if (value) {
        return computeStyles(value);
    } else {
        return "#ccc";
    };
};

module.exports = styles;
