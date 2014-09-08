/*
 * grunt-locales-extend
 * https://bitbucket.org/dlents/grunt-locales-extend
 *
 * Copyright (c) 2014 David Lents
 * Licensed under the MIT license.
 */


/**
 * Helpful links:
 * http://quickleft.com/blog/grunt-js-tips-tricks
 * http://gruntjs.com/api/grunt.config
 * http://gruntjs.com/api/inside-tasks
 * http://stackoverflow.com/questions/15284556/how-can-i-run-a-grunt-task-from-within-a-grunt-task
 *
 * For later (WP):
 * http://archetyped.com/know/grunt-for-wordpress-plugins/
 */

module.exports = function(grunt) {
  'use strict';

  // Use plugin to extend grunt-locales
  var extendGruntPlugin = require('extend-grunt-plugin');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('locales_extend', 'Extends grunt-locales plugin', function() {

    // quickleft.com
    var done = this.async();
    var files = this.files.slice();

    // ** Here's the extension part **
    // First, we have to get the real options added to this target
    // and config (files) from our project
    var localesConfig = grunt.config.get('locales.update');
    localesConfig.options = grunt.config.get('locales.options');

    // Merge task-specific and/or target-specific options with these defaults.

    grunt.log.writeln("config: \n"
      + JSON.stringify(
        localesConfig,
        undefined,
        3
      )
    );
    // Extend grunt-locales
    extendGruntPlugin(grunt, require('grunt-locales'), {
      'locales.update': localesConfig
    });

    // Run grunt-locales locales:update task
    grunt.task.run('locales:update');


    function process() {
      grunt.log.writeln("Starting process() ...");
      if(files.length <= 0) {
        grunt.log.writeln("Ooops, no (more) files found ...");
        done();
        return;
      }

      var file = files.pop();

      grunt.log.writeln("Processing " + file.src[0] + "...");
      var content = grunt.file.readJSON(file.src[0], { encoding: 'utf8' });

      // parse the input into the correct output here
      // then run locales:build

      grunt.file.write(file.dest,
        JSON.stringify(content) + '\n'
      );

      grunt.log.ok("Processed file written to " + file.dest);
      process();
    }

    process();

  });

};
