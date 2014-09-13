# grunt-locales-extend

> Extends grunt-locales plugin

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-locales-extend --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-locales-extend');
```

## The "locales_extend" task

### Overview

Note that `update`, `build`, `export`, and `import` are grunt-locale tasks, and they are simply passed off to the [grunt-locales](https://github.com/blueimp/grunt-locales) plugin. The options should also contain [grunt-locales](https://github.com/blueimp/grunt-locales) options. Refer to the [grunt-locales README](https://github.com/blueimp/grunt-locales) for details on the options and tasks.

This plugin extends the [grunt-locales](https://github.com/blueimp/grunt-locales) plugin by defining the `add_translations` task. This task parses external JSON file(s) containing translation text and updates the i18n JSON files created by the [grunt-locales](https://github.com/blueimp/grunt-locales) `update` task.

### Usage Examples

#### Setup
In your project's Gruntfile, add a section named `locales_extend` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  locales_extend: {
    options: {
      locales: ['en_US', 'de_DE']
    },
    update: {
        src: [
            'templates/**/*.html',
            'js/app/**/*.js'
        ],
        dest: 'js/locales/{locale}/i18n.json'
    },
    add_translations: {
        files: [{
            src: ['js/translations/**/*.json'],
            dest: '<%= locales_extend.update.dest %>'
        }]
    }
    build: {
        src: 'js/locales/**/i18n.json',
        dest: 'js/locales/{locale}/i18n.js'
    },
    'export': {
        src: 'js/locales/**/i18n.json',
        dest: 'js/locales/{locale}/i18n.csv'
    },
    'import': {
        src: 'js/locales/**/i18n.csv',
        dest: 'js/locales/{locale}/i18n.json'
    }
  },
});
```

### Options

#### options.separator
Type: `String`
Default value: `',  '`

A string value that is used to do something with whatever.

#### options.punctuation
Type: `String`
Default value: `'.'`

A string value that is used to do something else with whatever else.



#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  locales_extend: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  locales_extend: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
