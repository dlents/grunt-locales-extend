/**
 * Created by lents on 10/3/14.
 */

'use strict';

exports.init = function (grunt) {
   var Promise = require('bluebird'),
       request = Promise.promisifyAll(require('request'));

   var exports = {};

   // exports.Promise = Promise;
   exports.defaultOptions = {
      url: 'https://poeditor.com/api/',
      method: 'POST',
      strictSSL: false
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
      function clientError(e) {
         console.error('oops!');
         return e.code >= 400 && e.code < 500;
      };

      return request.postAsync(reqOptions)
          .spread(function (response, body) {
             var info = JSON.parse(body);
             // // console.log("Response:\n" + JSON.stringify(info, null, 3));
             return response.body;
          })
          .catch(clientError, function(e){
             console.error(e);
          });
   };

   return exports;
};
