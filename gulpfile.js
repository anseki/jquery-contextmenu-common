/* eslint-env node, es6 */

'use strict';

const
  gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  sass = require('gulp-sass'),
  iconfont = require('gulp-iconfont'),
  ttf2woff2 = require('gulp-ttf2woff2'),
  consolidate = require('gulp-consolidate'),
  rename = require('gulp-rename'),

  JS_SRC = 'src/jquery.contextMenuCommon.js',
  JS_DEST = 'dist',
  STYLES_SRC = 'src/sass/jquery.contextMenuCommon.scss',
  STYLES_DEST = 'dist',
  ICONS = {
    src: 'src/icons/*.svg',
    templateFileFont: 'src/sass/icons/_variables.scss.tpl',
    templateFileIconClasses: 'src/sass/icons/_icon_classes.scss.tpl',
    fontOutputPath: 'dist/font',
    scssOutputPath: 'src/sass/icons/'
  };

gulp.task('js', () =>
  gulp.src(JS_SRC)
    .pipe(uglify())
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest(JS_DEST))
);

gulp.task('css', () =>
  gulp.src(STYLES_SRC)
    .pipe(sass({outputStyle: /*'expanded'*/'compressed'}))
    .pipe(rename({extname: '.min.css'}))
    .pipe(gulp.dest(STYLES_DEST))
);

gulp.task('build-icons1', () =>
  gulp.src(ICONS.src)
    .pipe(iconfont({
      fontName: 'context-menu-common-icons',
      // formats: ['ttf', 'eot', 'woff', 'woff2'],
      fontHeight: 1024,
      descent: 64,
      normalize: true,
      appendCodepoints: false,
      startCodepoint: 0xE001
    }))
    .on('glyphs', glyphs => {
      var options = {
        glyphs: glyphs,
        className: 'context-menu-icon',
        mixinName: 'context-menu-item-icon'
      };

      gulp.src(ICONS.templateFileFont)
        .pipe(consolidate('lodash', options))
        .pipe(rename({basename: '_variables', extname: '.scss'}))
        .pipe(gulp.dest(ICONS.scssOutputPath));

      gulp.src(ICONS.templateFileIconClasses)
        .pipe(consolidate('lodash', options))
        .pipe(rename('_icons.scss'))
        .pipe(gulp.dest('src/sass')); // set path to export your sample HTML
    })
    .pipe(gulp.dest(ICONS.fontOutputPath))
);

gulp.task('build-icons2', ['build-icons1'], () =>
  gulp.src(ICONS.fontOutputPath + '/*.ttf')
    .pipe(ttf2woff2())
    .pipe(gulp.dest(ICONS.fontOutputPath))
);

gulp.task('build-icons', ['build-icons1', 'build-icons2']);
gulp.task('build-exicons', ['js', 'css']);
gulp.task('build', ['build-icons', 'js', 'css']);
