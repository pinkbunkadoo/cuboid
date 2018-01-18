var gulp = require('gulp');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var fs = require('fs');

var src = 'app/js/engine.js';
var dest = './dist';

function bundle(debug) {
  browserify({
    entries: src,
    debug: debug
  })
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(gulp.dest(dest));

  gulp.src('app/css/*')
    .pipe(gulp.dest(dest + '/css'));

  gulp.src('app/data/*')
    .pipe(gulp.dest(dest + '/data'));

  gulp.src('app/index.html')
    .pipe(gulp.dest(dest));
}

gulp.task('release', () => {
  bundle(false)
});

gulp.task('debug', () => {
  bundle(true)
});

gulp.task('default', ['debug']);
