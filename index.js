'use strict';
 var debug = require('debug')('plugin:volos-cache-memory');
 var cm = require('volos-cache-memory');
 var async = require('async');

 var cache = cm.create('name', {
     ttl: 10000
 }); // specifies default ttl as 1000 ms
 var counter = 0;

 module.exports.init = function(config, logger, stats) {

     return {

         onrequest: function(req, res, next) {
            //debug(cache);
            counter += 1;
             debug('on request...' + counter);
             debug(JSON.stringify(req.headers));
             //debug(req);
             //debug(req.url);
             debug(req.headers.host);
             var tokenValue = req.headers.host;
             var key = req.url;

             async.waterfall([
               function(callback) {
                 cache.get(key, function(err, val) {
                    if(err){
                     debug('error is: ' + err);
                     tokenValue = null;
                   } else {
                     //tokenValue = val;
                     debug("tokenValue is " + val);
                   }
                     callback(null, val);
                 });
               }],
               function(err, result){
                 if (result != null) { // cache found. proceed
                     debug('tokenValue found. ' + result);
                 } else { //setting cache
                     debug('setting cache with key and value: ' + key + ': ' + req.headers.host);
                     cache.set(key, req.headers.host);
                     //debug(cache);
                     debug('putting in cache');
                 }
               });


             next();
         }
     };
 }
