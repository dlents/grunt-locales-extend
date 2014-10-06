/**
 * Created by lents on 10/3/14.
 */

'use strict';

var request = require('request'),
    querystring = require('querystring');

exports.init = function (grunt) {
   var exports = {};

   exports.defaultOptions = {
      url: 'https://poeditor.com/api/',
      method: 'POST'
   };

   exports.requestAPI = function (options, action, data, handler) {

      // set up the API request (POST) query string
      var reqOptions = options.api || exports.defaultOptions;

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

      reqOptions.form = apiCommand;

      // console.log("In requestAPI with options:\n" + JSON.stringify(reqOptions, null, 3));
      request(reqOptions, function (error, response, body) {
         console.log('In request callback');
         if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            console.log("Response:\n" + JSON.stringify(info, null, 3));
         }
         else {
            console.log('Error: ' + response.statusCode);
            console.log(body);
         }
      });
      return true;

   };
   return exports;
};
