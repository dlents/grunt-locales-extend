/*
 * {%= name %}
 * {%= homepage %}
 *
 * Copyright (c) {%= grunt.template.today('yyyy') %} {%= author_name %}
 * Licensed under the {%= licenses.join(', ') %} license{%= licenses.length === 1 ? '' : 's' %}.
 */


module.exports = function(grunt) {
  'use strict';
  var _s = require('underscore');
  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  function MyTask(task) {
    this.options = task.options({
      pluginExtender: {
        basePluginName: "grunt-locales",
        basePluginTask: "locales"
      },
      localePlaceholder: '{locale}',
      localeName: 'i18n',
      jsonSpace: 2
    });

    this.task = task;
    this.done = task.async();

    // initialize the plugin we're extending
    this.basePlugin = this.initializeBasePlugin();

    if (grunt.util.kindOf(this[task.target]) === 'function') {
      this[task.target]();
    }
    else {
      this.passthru();
    }

  }

  grunt.registerMultiTask(
    'locales_extend',
    'Extends grunt-locales plugin',
    function () {
      return new MyTask(this);
    }
  );

  function extend(dst) {
    grunt.util.toArray(arguments).forEach(function (obj) {
      var key;
      if (obj && obj !== dst) {
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            dst[key] = obj[key];
          }
        }
      }
    });
    return dst;
  }

  extend(MyTask.prototype, {
    extend: extend,

    /*
     * property names here correspond to task targets
     */

    initializeBasePlugin: function() {
      var basePluginOptions = this.options.pluginExtender,
        basePluginConfig = grunt.config.get(this.task.name);

      var plugin = require(basePluginOptions.basePluginName);
      var pluginExports = plugin(grunt);
      grunt.config.set(basePluginOptions.basePluginTask, basePluginConfig);
      // current task config is now gone ...
      grunt.config.set(this.task.name, basePluginConfig);
      return pluginExports; // may not be useful, or even be defined ...
    },

    passthru: function() {
      var that = this,
        baseTask = this.options.pluginExtender.basePluginTask,
        baseTarget = baseTask + ':' + that.task.target;

      grunt.task.run(baseTarget);
      return that.done();

    },

    logObject: function (obj, msg) {
      var theObject = obj,
        theMessage = msg|| 'logObject: ';
      grunt.log.writeln(theMessage + JSON.stringify(
        theObject,
        this.options.jsonReplacer,
        this.options.jsonSpace
      ));
    },

    import_external_messages: function () {
      var that = this,
        dest = this.getDestinationFilePath(),
        locale,
        externalMessages,
        messages = {};

      externalMessages = that.parseExternalMessages();
      Object.keys(externalMessages).forEach(function (locale) {
        var localeFile = dest.replace(that.options.localePlaceholder, locale),
          localFileExists = grunt.file.exists(localeFile),
          externalLocaleData = externalMessages[locale],
          dataId;
        if (localFileExists) {
          messages = grunt.file.readJSON(localeFile);
          grunt.log.writeln('Parsed locale messages from ' + localeFile.cyan + '.');
        }
        for (dataId in externalLocaleData) {
          if (messages.hasOwnProperty(dataId)) {
            messages[dataId].value = externalLocaleData[dataId].value;
            var msgFiles = messages[dataId].files || [];
            if (externalLocaleData[dataId].files.length > 0) {
              msgFiles = msgFiles.concat(externalLocaleData[dataId].files);
            }
            msgFiles.sort();
            messages[dataId].files = _s.unique(msgFiles, true);
          }
          else {
            messages[dataId] = externalLocaleData[dataId];
          }
        }
        grunt.file.write(localeFile, JSON.stringify(
          messages,
          that.options.jsonReplacer,
          that.options.jsonSpace
        ));
      });
      return that.done();
    },

    parseExternalMessages: function () {
      var that = this,
        externalMessages = {},
        localeData = {},
        key;

      this.getSourceFiles().forEach(function (file) {
        var dataId,
          externalMessages = grunt.file.readJSON(file);
        grunt.log.writeln('Parsed external messages from ' + file.cyan + '.');
        for (dataId in externalMessages) {
          var locales = externalMessages[dataId].locales,
            files = externalMessages[dataId].files || [];

          Object.keys(locales).forEach(function (locale) {
            var data = {};
            if (!localeData.hasOwnProperty(locale)) {
              localeData[locale] = {};
            }
            data = {
              value: locales[locale].value,
              files: files
            };
            localeData[locale][dataId] = data;
          });
        }
      });
      return localeData;
    },

    /*
     * Utility properties (functions)
     */

    getSourceFiles: function () {
      var files = this.task.filesSrc;
      if (this.task.args.length) {
        files = this.task.args;
      }
      return files.filter(function (file) {
        if (!grunt.file.exists(file)) {
          grunt.log.warn('Source file ' + file.cyan + ' not found.');
          return false;
        }
        return true;
      });
    },

    getDestinationFilePath: function () {
      var dest = this.task.files.length && this.task.files[0].dest;
      if (!dest) {
        grunt.fail.warn('Missing destination file path.');
        return this.done();
      }
      return dest;
    }

  });

};
