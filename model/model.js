var Q = require('q'),
    python = require('python-shell'),
    path = require('path'),
    fs = require('fs')
    config = require('../conf/config');

var model = {};

model.run = function(inputs) {
    var d = Q.defer()

    var options = {
        mode: 'text',
        pythonOptions: ['-u'],
        scriptPath: './',
        args: ['-d=' + JSON.stringify(inputs), '-m=' + config.model_function]
    }

    python.run('/model/model_adapter.py', options, function(err, results) {
        if (err) throw err;
        console.log(results);
        d.resolve(results);
    });

    return d.promise;
}

module.exports = model;
