module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      'public/js/app.js': ['client/js/app.js'],
      'public/js/map.js': ['client/js/map.js'],
      'public/js/styles.js': ['client/js/styles.js'],
      'public/js/inputs.js': ['client/js/inputs.js'],
      'public/js/outputs.js': ['client/js/outputs.js'],
      'public/js/plots.js': ['client/js/plots.js']
    },
    watch: {
      files: [ "client/**/*.js", "client/**/*.css", "conf/*.json"],
      tasks: [ 'build']
    },
    uglify: {
        app: {
          files: {
            'public/js/app.min.js': ['public/js/app.js']
          }
        }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      dashboard: {
        files: {
            'public/stylesheets/dashboard.min.css': [
            'client/stylesheets/style.css',
            ]
        }
      },
    },
  });
  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('build', [
    'browserify',
    //'uglify:app',
    'cssmin:dashboard'
  ]);
}
