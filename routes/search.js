var express = require('express');
var router = express.Router();
var request = require('request');
var Promise = require('promise');
var waterfall = require('async-waterfall');
var rp = require('request-promise');
var cheerio = require('cheerio');
var winston = require('winston');
var http = require('http');
var https = require('https');


http.globalAgent.maxSockets = 1;
https.globalAgent.maxSockets = 1;

const materiamedicaBaseURL = 'http://www.materiamedica.info';
const johnHenryIndexPageURL = '/en/materia-medica/john-henry-clarke/index';

router.post('/', function (req, res) {
    var search_term = req.body.term;
    waterfall([
        function(callback) {
            rp({
                uri: materiamedicaBaseURL + johnHenryIndexPageURL,
                transform: function (body) {
                    return cheerio.load(body);
                }
            })
            .then(($) => {
                callback(null, $);
            }).catch(function (err) {
                console.log('--------- ERROR Cheerio chocked: ' + err);
            });
        }, function($, callback) {
            var medicineObjArray = [];
            $('.remedy_list a').each((index, elem) => {
                var text = $(elem).text();
                var link = $(elem).attr('href');
                if (text != '' && link != undefined) {
                    medicineObjArray.push({
                        medicine: text,
                        link: link
                    });
                }
            });
            callback(null, medicineObjArray);
        },
        function(medicineObjArray, callback) {
            var promises = medicineObjArray.map(function(item, index){
                rp(
                    {
                        uri : materiamedicaBaseURL + item.link,
                        method: 'GET',
                        transform: function(body){
                            return cheerio.load(body);
                        }
                    }
                ).then(($) => {
                    if ($('.content:contains("faint feeling at epigastrium")').length > 0) {
                        console.log('--- found at: ' + item.medicine);
                        var med = {
                            medicine: item.medicine,
                            link: materiamedicaBaseURL + item.link
                        };
                        return med;
                    } else {
                        return;
                    }
                }).catch(function(err){
                    console.log(err);
                    return;
                });
            });
            return Promise.all(promises).then((data) => {
                res.send(data[0]);
            });
        }
    ], function(err, result){
        res.send(data);
    });

    /*rp({
        uri: materiamedicaBaseURL + johnHenryIndexPageURL,
        transform: function (body) {
            return cheerio.load(body);
        }
    })
    .then(($) => {
        $('.remedy_list a').each((index, elem) => {
            var text = $(elem).text();
            var link = $(elem).attr('href');
            if (text != '' && link != undefined) {
                medicineObjArray.push({
                    medicine: text,
                    link: link
                });
            }
        });

        var promises = medicineObjArray.map(function(item, index){
            rp(
                {
                    uri : materiamedicaBaseURL + item.link,
                    method: 'GET',
                    transform: function(body){
                        return cheerio.load(body);
                    }
                }
            ).then(($) => {
                if ($('.content:contains("paralysis")').length > 0) {
                    console.log('--- paralysis found at: ' + item.medicine);
                    var med = {
                        medicine: item.medicine,
                        link: materiamedicaBaseURL + item.link
                    };
                    return med;
                } else {
                    return;
                }
            }).catch(function(err){
                console.log(err);
                return;
            });
        });
    
        return Promise.all(promises).then((data) => {
            res.send(data[0]);
        });
    })
    .then((data) => {
        res.send(data);
    })
    .catch(function (err) {
        console.log('--------- ERROR Cheerio chocked: ' + err);
    });*/
});

module.exports = router;