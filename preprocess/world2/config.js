/**
 * Configuration for resilience tool map preprocessing.
 */
config = {
    // the model instance webapp configuration
    "web_config": "world2/web_config.json",
    "inputs": {
        // model input data
        "df": "world2/df_for_wrapper.csv",
        "info": "world2/inputs_info_wrapper.csv",
        "function": "world2/res_ind_lib.py"
    },
    // model outputs
    "outputs": ['risk', 'resilience', 'risk_to_assets'],
    "output_minimap_colors":{
        'risk': '#88419D',
        'resilience': '#EF6548',
        'risk_to_assets': '#4EB3D3'
    },
    "layers": {
        // shapefile layers to convert to topojson
        "model_features": {
            // layer name in topojson
            "layer_name": "model_features",
            // input shapefile name - relative to index.js
            "shape_file": "world/shp/WB_CountryPolys.shp",
            // fields to preserve from input shapefile to output topojson
            "filter_fields": "_Name,ISO_Codes",
            // rename input fields in output topojson
            "rename_fields": "name=_Name,id=ISO_Codes",
            // join field on input data
            "data_join_field": "id",
            // join field on shpapefile
            "shp_join_field": "ISO_Codes",
        },
        "coastlines": {
            // layer name in topojson
            "layer_name": "coastlines",
            // input shapefile name - relative to index.js
            "shape_file": "world/shp/WB_Coastlines.shp"
        },
        "international_boundaries": {
            // layer name in topojson
            "layer_name": "international_boundaries",
            // input shapefile name - relative to index.js
            "shape_file": "world/shp/WB_IntlBdies.shp",
            // filter fields
            "filter_fields": "_Id,_LayerName,Style",
        },
        "disputed_areas": {
            // layer name in topojson
            "layer_name": "disputed_areas",
            // input shapefile name - relative to index.js
            "shape_file": "world/shp/WB_DispAreas.shp",
            // filter fields
            "filter_fields": "ISO_Codes,Names,Regions,Rules,_LayerName,F_Id",
        },
        "disputed_boundaries": {
            // layer name in topojson
            "layer_name": "disputed_boundaries",
            // input shapefile name - relative to index.js
            "shape_file": "world/shp/WB_DispBdies.shp",
            // filter fields
            "filter_fields": "_Id,_LayerName,Style",
        },
    },
    "map": {
        // ploygon simplification tolerance
        "simplify_poly": "20%",
        // line simplification tolerance
        "simplify_line": "20%",
        // svg/topojson width and height
        "width": 500,
        "height": 350,
        "margin": 15,
        "projection": 'd3.geo.robinson()'
    },
    "svg": {
        // svg styles
        "styles": {
            "nodata": {
                "fill": "#CCC"
            },
            "coastlines": {
                "fill": "none",
                "stroke": "#666",
                "stroke-width": ".2px",
                "stroke-linejoin": "miter"
            },
            "international_boundaries": {
                "fill": "none",
                "stroke": "#666",
                "stroke-width": ".2px",
                "stroke-linejoin": "miter"
            },
            "disputed_boundaries": {
                "fill": "none"
            },
            "disputed_areas":{
                "fill": "#CCC"
            },
            "dotted_line": {
                "fill": "none",
                "stroke": "#666",
                "stroke-width": ".2px",
                "stroke-dasharray": ".8, .8",
                "stroke-linejoin": "miter"
            },
            "dashed_line": {
                "fill": "none",
                "stroke": "#666",
                "stroke-width": ".2px",
                "stroke-dasharray": ".1, .8",
            },
            "tightly_dashed_line": {
                "fill": "none",
                "stroke": "#666",
                "stroke-width": ".2px",
                "stroke-dasharray": "1.5, .5",
                "stroke-linejoin": "miter"
            }
        }
    },
    // the topojson output filename
    "topojson_out": "map_data.topojson"
}

module.exports = config;
