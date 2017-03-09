## Preprocess

### This package contains **topojson** and **svg** processing scripts.

The scripts take a shapefile, a csv containing model input data and a configuration file and generate topjson and svg outputs. Both the topojson and svg ouputs are used in the visualization interface.

**Note:** The scripts in the **world** package are for processing world data only.

```
Usage: ./index.js [--config phl/config.js,
                                 --clean, --svg, --web,
                                 --topojson
                                ]

Options:
  --config, -c  The preprocess configuration file               [string]
  --svg, -s     Generate standalone svg file                    [boolean]
  --clean       Remove all generated files                      [boolean]
  --web         Generate files required for web visualization   [boolean]
  --topojson    Generate a topojson file                        [boolean]
  --help        Show help                                       [boolean]
```
#### Example
To generate the philippines topojson and output map png's run:

```
./index --config phl/config.js --web
```
See phl/config.js for configuration details.
