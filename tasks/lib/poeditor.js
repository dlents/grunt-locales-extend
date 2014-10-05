/**
 * Created by lents on 10/3/14.
 */

'use strict';

var https = require('https'),
      querystring = require('querystring');

exports.init = function (grunt) {
   var exports = {};

   exports.defaultOptions = {
      host: 'poeditor.com',
      port: 443,
      path: '/api/',
      method: 'POST',
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Length': 0
      }
   };

   exports.requestAPI = function (options, action, data) {

      // set up the API request (POST) query string
      var request = options.api || exports.defaultOptions;
      var apiCommand = {
         api_token: options.api_token,
         id: options.project_id,
         action: action
      };

      for (var property in data) {
         var value;
         if (property === 'data') {
            value = JSON.stringify(data[property]);
         }
         else {
            value = data[property];
         }
         if (data.hasOwnProperty(property)) {
            apiCommand[property] = value;
         }
      }

      var apiPostData = querystring.stringify(apiCommand);
      request.headers['Content-Length'] = apiPostData.length;
      if (action === 'update_language') {
         console.log("Request:\n" + JSON.stringify(request, null, 3));
         console.log("\n\napiCommand:\n" + JSON.stringify(apiCommand, null, 3));
         console.log("\n\napiPostData:\n" + JSON.stringify(apiPostData, null, 3));
      }

      var req = https.request(request, function (res) {
         res.setEncoding('utf8');
         console.log("statusCode: ", res.statusCode);
         console.log("headers: ", res.headers);

         res.on('data', function (d) {
            var res = JSON.parse(d);
            console.log(JSON.stringify(res, null, 3));
         });
      });
      req.write(apiPostData);
      req.end();
      req.on('error', function (e) {
         console.error(e);
         console.error("post data:\n" + apiPostData);
      });
   };

   return exports;
};
