var gulp = require('gulp');
var graphextract = require('../src/index');

gulp.task('autograph', function() {
	return gulp.src('data/doc_autograph.md')
		.pipe(graphextract())
		.pipe(gulp.dest('data/'));
});

gulp.task('dotex', function() {
	return gulp.src('data/doc_dotex.md')
		.pipe(graphextract({ mode: 'dotex' }))
		.pipe(gulp.dest('data/'));
});

gulp.task('default', ['autograph', 'dotex']);