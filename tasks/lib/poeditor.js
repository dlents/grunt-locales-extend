/**
 * Created by lents on 10/3/14.
 */

'use strict';

var https = require('https'),
      querystring = require('querystring');

exports.init = function (grunt) {
   var exports = {};

   exports.poeditor = function (options, action, data) {
      data = data || {};

      // set up the API request (POST) query string
      var request = options.api;
      var apiPostData = {
         api_token: options.api_token,
         id: options.project_id,
         action: action
      };

      for(var property in data) {
         var value;
         if (property === 'data') {
            value = JSON.stringify(data[property]);
         }
         else {
            value = data[property];
         }
         apiPostData[property] = value;
      }
      request.headers['Content-Length'] = apiPostData.length;
      console.log("Request:\n" + JSON.stringify(request));
      console.log("\n\napiPostData:\n" + JSON.stringify(apiPostData));
   };

   return exports;
};
