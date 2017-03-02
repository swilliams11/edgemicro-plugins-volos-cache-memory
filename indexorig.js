'use strict';
 var debug = require('debug')('plugin:idam_<wbr>validate');
 var cm = require('volos-cache-memory');
 module.exports.init = function(config, logger, stats) {
     return {
         onrequest: function(req, res, next) {
             console.log('on request...');
             var cache = cm.create('name', {
                 ttl: 10000
             }); // specifies default ttl as 1000 ms
             console.log(JSON.stringify( < wbr > req.headers));
             var tokenValue = '';
             var ssoToken = 'ssosessionkey';
             if (ssoToken) { //getting from cache'
                 cache.get(ssoToken, function(err, val) {
                     tokenValue = val
                 });
             }
             if (tokenValue != null) { // cache found. proceed
                 console.log('tokenValue found. ' + JSON.stringify(tokenValue));
             } else { //setting cache
                 cache.set(ssoToken, 'value');
                 console.log('putting in cache');
             }
             next();
         }
     };
 }
