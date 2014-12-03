/*
 * {%= name %}
 * {%= homepage %}
 *
 * Copyright (c) {%= grunt.template.today('yyyy') %} {%= author_name %}
 * Licensed under the {%= licenses.join(', ') %} license{%= licenses.length === 1 ? '' : 's' %}.
 */

'use strict';

var _s = require('underscore'); // TODO: should be outside module.exports?

module.exports = function (grunt) {
    // MessageFormat.locale['CN'] = MessageFormat.locale.zh;
    // MessageFormat.locale['TW'] = MessageFormat.locale.zh;
    // MessageFormat.locale.zh=function(n){return "other"}
    // internal lib that provides poeditor API function
    var poeditor = require('./lib/poeditor').init(grunt);

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    function ExtendedTask(task) {
        this.options = task.options({
            pluginExtender: {
                basePluginName: "grunt-locales",
                basePluginTask: "locales"
            },
            localePlaceholder: '{locale}',
            localeName: 'i18n',
            jsonSpace: 2,
            poeditor: {
                api_token: '',  // required, obviously
                project_id: '',
                reference_language: 'en'
            }
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
                return new ExtendedTask(this);
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

    extend(ExtendedTask.prototype, {
        extend: extend,

        /*
         * property names here correspond to task targets
         */

        initializeBasePlugin: function () {
            var basePluginOptions = this.options.pluginExtender,
                    basePluginConfig = grunt.config.get(this.task.name);

            var plugin = require(basePluginOptions.basePluginName);
            var pluginExports = plugin(grunt);
            grunt.config.set(basePluginOptions.basePluginTask, basePluginConfig);
            // current task config is now gone ...
            grunt.config.set(this.task.name, basePluginConfig);
            return pluginExports; // may not be useful, or even be defined ...
        },

        passthru: function () {
            var that = this,
                    baseTask = this.options.pluginExtender.basePluginTask,
                    baseTarget = baseTask + ':' + that.task.target;

            grunt.task.run(baseTarget);
            return that.done();

        },

        logObject: function (obj, msg) {
            var theObject = obj,
                    theMessage = msg || 'logObject: ';
            grunt.log.writeln(theMessage + JSON.stringify(
                    theObject,
                    this.options.jsonReplacer,
                    this.options.jsonSpace
            ));
        },

        poeditor_list_languages: function () {
            var that = this,
                    langCodes = [];

            return that.callPOEditorAPI('list_languages')
                    .then(function (res) {
                        console.log('Got: ', JSON.stringify(res, null, 3));
                        res.list.forEach(function (langData) {
                            langCodes.push(langData.code);
                        });
                        return that.options.locales = langCodes;
                    })
                    .catch(function (e) {
                        console.error(e);
                    });
        },

        poeditor_available_languages: function() {
            var that = this,
                    langCodes = [];
            return that.callPOEditorAPI('available_languages')
                    .then(function(res) {
                        console.log('Available languages: ', JSON.stringify(res, null, 3));
                    })
                    .catch(function(e) {
                        console.error(e);
                    });
        },

        poeditor_update_terms: function () {
            var that = this,
                    refLanguage = this.options.poeditor.reference_language,
                    poEdTermsUpdate = [],
                    poEdTranslationsUpdate = [],
                    refLocaleFiles = this.getSourceFiles().filter(function (file) {
                        if (!grunt.file.exists(file)) {
                            grunt.log.warn('Source file ' + file.cyan + ' not found.');
                            return false;
                        }
                        if (file.match('/' + refLanguage + '/')) {
                            return true;
                        }
                        return false;
                    });

            refLocaleFiles.forEach(function (file) {
                var dataId,
                        messages = grunt.file.readJSON(file);

                for (dataId in messages) {
                    var term = {
                        term: dataId,
                        context: "",
                        reference: messages[dataId].files[0],
                        plural: ""
                    };
                    poEdTermsUpdate.push(term);
                    var refTranslation = {
                        term: {
                            term: dataId,
                            context: ""
                        },
                        definition: {
                            forms: [
                                messages[dataId].value
                            ]
                        }
                    };
                    poEdTranslationsUpdate.push(refTranslation);
                }
                grunt.log.writeln('Parsed reference locale file ' + file.magenta + '.');
            });

            that.callPOEditorAPI('sync_terms', {data: poEdTermsUpdate});
            // poeditor.requestAPI(that.options.poeditor, 'add_terms', {data: poEdTermsUpdate});
            that.callPOEditorAPI('update_language', {language: refLanguage, data: poEdTranslationsUpdate});
            // that.done(); // can't do that with the api calls above
        },

        poeditor_get_translations: function () { //TODO: probably needs optional language(s) argument
            var that = this,
                    dest = that.getDestinationFilePath();

            that.poeditor_list_languages()
                    .then(function (langList) {
                        langList.forEach(function (locale) {
                            that.callPOEditorAPI('view_terms', {language: locale})
                                    .then(function (res) {
                                        // console.log('Got: ', JSON.stringify(res, null, 3));

                                        var messages = {},
                                                externalMessages = that.parsePoEditorTranslation(locale, res.list);

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
                                                if (externalLocaleData[dataId].value != '') {
                                                    messages[dataId].value = externalLocaleData[dataId].value;
                                                }
                                                var msgFiles = messages[dataId].files;
                                                if (externalLocaleData[dataId].files.length > 0) {
                                                    msgFiles = msgFiles.concat(externalLocaleData[dataId].files);

                                                }
                                                if (msgFiles.length > 1) {
                                                    // msgFiles.sort();
                                                    msgFiles = _s.unique(msgFiles, true);
                                                }
                                                messages[dataId].files = msgFiles;
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
                                        // console.log('Got: ', JSON.stringify(data, null, 3));
                                    })
                                    .catch(function (e) {
                                        console.error(e);
                                    });
                        });
                    });
        },

        parsePoEditorTranslation: function (locale, terms) {
            var that = this,
                    localeData = {},
                    key;
            localeData[locale] = {};
            terms.forEach(function (termData) {
                var term = termData.term,
                        files = Array.isArray(termData.reference) ? termData.reference : [termData.reference];
                // console.log('files: ', files);
                // console.log('localeData[locale][term]: ', locale, term)
                localeData[locale][term] = {
                    value: termData.definition.form,
                    files: files
                };

            });
            return localeData;
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
                        // reject template vars
                        if (!locales[locale].value.contains('{{')) {
                            if (!localeData.hasOwnProperty(locale)) {
                                localeData[locale] = {};
                            }
                            var data = {
                                value: locales[locale].value,
                                files: files
                            };
                            localeData[locale][dataId] = data;
                        }
                        else {
                            grunt.log.writeln('Skipping bad value in term "' + dataId.cyan + '"');
                            grunt.log.writeln('Term: ' + locales[locale].value.red);
                        }
                    });
                }
            });
            return localeData;
        },

        // used to delete terms from testing - left here for reference
        poeditor_delete_terms: function () {
            // one time thing
            var that = this,
                    terms = ['test1', 'test2', 'test3', 'test4', 'This is a test'],
                    contexts = ['context for test1', 'context for test2', 'context for test1', 'context for test2', ''],
                    args = {data: []};

            terms.forEach(function (element, index) {
                args.data.push({
                    term: element,
                    context: contexts[index]
                });
            });

            that.callPOEditorAPI('delete_terms', args);

        },

        callPOEditorAPI: function (action, args) {
            var that = this;
            return poeditor.requestAPI(that.options.poeditor, action, args)
                    .then(function (response) {
                        return JSON.parse(response);
                    })
                    .catch(function (e) {
                        console.error('Error: ', e);
                    });
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
