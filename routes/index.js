var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    model = require('../model/model'),
    csv2json = require('csv2json')
    config = require('../conf/config');

var router = express.Router();

var title = 'Preliminary tool for measuring socio-economic resilience to natural disasters';

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('dashboard', {
        title: title
    });
});

// runs the model
router.post('/runmodel', function(req, res) {
    res.setHeader('content-type', "application/json");
    var p = model.run(req.body);
    p.then(function(data){
        res.send(data);
    });
});

// gets the map features as topojson
router.get('/features.json', function(req, res) {
    res.setHeader("content-type", "application/json");
    fs.createReadStream("data/map_data.topojson").pipe(res);
});

// gets the inputs info data
router.get('/inputs.json', function(req, res) {
    res.setHeader("content-type", "application/json");
    fs.createReadStream('data/' + config.inputs_info)
        .pipe(csv2json({}))
        .pipe(res);
});

// gets the application configuration
router.get('/config.json', function(req, res) {
    res.setHeader("content-type", "application/json");
    fs.createReadStream("conf/config.json").pipe(res);
});

// gets the inital model data
router.get('/modeldata.json', function(req, res){
    res.setHeader("content-type", "application/json");
    fs.createReadStream('data/' + config.model_data)
        .pipe(csv2json({}))
        .pipe(res);
})

module.exports = router;
