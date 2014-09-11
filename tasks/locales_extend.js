/*
 * {%= name %}
 * {%= homepage %}
 *
 * Copyright (c) {%= grunt.template.today('yyyy') %} {%= author_name %}
 * Licensed under the {%= licenses.join(', ') %} license{%= licenses.length === 1 ? '' : 's' %}.
 */


module.exports = function(grunt) {
  'use strict';

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  // Use plugin to extend grunt-locales
  var extendGruntPlugin = require('extend-grunt-plugin');

  function MyTask(task) {
    this.options = task.options({
      separator: ', ',
      punctuation: "\n",
      localePlaceholder: '{locale}',
      localeName: 'i18n',
      jsonSpace: 2
    });

    this.task = task;
    this.done = task.async();
    grunt.log.writeln("task " + task.target + " is a " + grunt.util.kindOf(this[task.target]));

    // initialize the plugin we're extending
    this.basePlugin = this.initBasePlugin();

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

    initBasePlugin: function() {
        var basePluginName = this.options.basePlugin.pluginName,
          basePluginTask = this.options.basePlugin.pluginTask,
          basePluginConfig = grunt.config.get(this.task.name),
          newGrunt = grunt;

      // var plugin = require(basePluginName);
      // newGrunt.config.set(basePluginTask, basePluginConfig);
      // this.logObject(newGrunt.config.get());
      return plugin;
    },

    passthru: function() {
      var that = this,
        basePlugin = this.options.basePlugin.pluginName,
        baseTask = this.options.basePlugin.pluginTask,
        passthruTasks = {};
      var baseTarget = baseTask + ':' + that.task.target;
      var baseConfig = baseTarget.replace(':', '.');

      passthruTasks[baseTask] = that.options;
      passthruTasks[baseConfig] = that.task.data;

      extendGruntPlugin(grunt, that.basePlugin, passthruTasks);

      grunt.task.run(baseTarget);
      return this.done();

    },

    logObject: function (obj) {
      var theObject = obj;
      grunt.log.writeln('logObject: ' + JSON.stringify(
        theObject,
        this.options.jsonReplacer,
        this.options.jsonSpace
      ));
    },

    ext_update: function () {
      var that = this,
        dest = this.getDestinationFilePath(),
        locale,
        externalMessages,
        messages = {};

      // this.logObject(foo);
      var plugin = this.basePlugin;
      var bar = plugin.jsEscape('var data = "OUTPUT"');
      this.logObject(bar);
      // this.logObject(this.jsEscape('var data = "OUTPUT"'));

      return that.done();

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
            if (typeof externalLocaleData[dataId].files == 'array' && externalLocaleData[dataId].files.count > 0) {
              messages[dataId].files = externalLocaleData[dataId].files;
            }
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
