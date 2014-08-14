var gulp = require('gulp');
var shell = require('gulp-shell');

gulp.task('test', shell.task([
	'tape ./tests/*.js | tspec'
], { ignoreErrors: true }));

gulp.task('autotest', function() {
	gulp.watch([
		'./src/*.js', 
		'./tests/*.js', 
		'./tests/data/*'
	], ['test']);
});