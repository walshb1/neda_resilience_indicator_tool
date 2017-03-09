/**
 * Configuration for resilience tool map preprocessing.
 */
config = {
    // the model instance webapp configuration
    "web_config": "phl_demo/web_config.json",
    "inputs": {
        // model input data
        "df": "phl_demo/df_phl_demo.csv",
        "info": "phl_demo/inputs_info.csv",
        "function": "phl_demo/res_ind_lib.py"

    },
    // model outputs
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
            "shape_file": "phl_demo/shp/phl_polbnda_adm2_gsi.shp",
            // fields to preserve from input shapefile to output topojson
            "filter_fields": "name,id",
            // rename input fields in output topojson
            "rename_fields": "",
            // join field on input data
            "data_join_field": "id",
            // join field on shpapefile
            "shp_join_field": "id",
        }
    },
    "map": {
        // ploygon simplification tolerance
        "simplify_poly": "20%",
        // line simplification tolerance
        "simplify_line": "20%",
        // svg/topojson width and height
        "width": 500,
        "height": 530,
        "margin": 15,
        "projection": 'd3.geo.equirectangular()'
    },
    "svg": {
        // svg styles
        "styles": {
            "nodata": {
                "fill": "#E0E0E0"
            },
        }
    },
    // the topojson output filename
    "topojson_out": "map_data.topojson"
}

module.exports = config;
