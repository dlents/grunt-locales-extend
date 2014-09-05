/*
 * grunt-locales-extend
 * https://bitbucket.org/dlents/grunt-locales-extend
 *
 * Copyright (c) 2014 David Lents
 * Licensed under the MIT license.
 */

'use strict';

// Use plugin to extend grunt-locales
var extendGruntPlugin = require('extend-grunt-plugin');

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('locales_extend', 'Extends grunt-locales plugin', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', '
    });

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        // Read file source.
        return grunt.file.read(filepath);
      }).join(grunt.util.normalizelf(options.separator));

      // Handle options.
      src += options.punctuation;

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
    });


    // Extend grunt-locales
    extendGruntPlugin(grunt, require('grunt-locales'), {
      'locales.update' : options
    });
    // Run grunt-locales locales:build task
    grunt.task.run('locales:update');
  });

};
