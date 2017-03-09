#!/usr/bin/env python3

"""Wrapper for running Socio-economic resilience indicator model."""

import argparse
import importlib
import json
import logging
import os
import sys
import time

import pandas as pd

PACKAGE_PARENT = '..'
SCRIPT_DIR = os.path.dirname(os.path.realpath(
    os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))


logging.basicConfig(
    filename='model/model.log', level=logging.DEBUG,
    format='%(asctime)s: %(levelname)s: %(message)s')


class Model():
    """Runs the resilience model."""

    def __init__(self, df=None, model_function=None, debug=False):
        d = json.loads(data_frame)
        df = pd.DataFrame.from_records([d], index='name')
        for col in df.columns:
            df[col] = self.to_float(df[col])
        self.df = df
        logging.debug(self.df)
        with open('model_inputs.csv', 'w') as f:
            f.write(self.df.to_csv())

        self.model_function = model_function
        self.debug = debug

    def to_float(self, obj):
        try:
            return obj.astype('float')
        except ValueError:
            return obj

    def run(self):
        output = self.model_function(self.df)
        logging.debug(output)
        return output

if __name__ == '__main__':

    parser = argparse.ArgumentParser(
        description="Run the Socio-economic Resilience Model.")
    parser.add_argument('-d', '--data-frame', required=True,
                        dest="data_frame", help="The input data frame")
    parser.add_argument('-m', '--model-function', required=True,
                        dest='model_function', help='The model function to run'
                        )
    args = parser.parse_args()
    config = {}
    for k, v in vars(args).items():
        if (v is None):
            continue
        else:
            config[k] = v
    data_frame = config.get('data_frame')
    mf = config.get('model_function')
    m = mf.split('.')[0]
    f = mf.split('.')[1]
    module = importlib.import_module('data.' + m)
    model_function = getattr(module, f)
    debug = False
    if config.get('debug'):
        debug = True

    model = Model(
        df=data_frame, model_function=model_function, debug=debug
    )
    startTime = time.time()
    output = model.run()
    elapsed = time.time() - startTime
    logging.debug('Running model took: {}'.format(elapsed))
    print(output.to_json())
