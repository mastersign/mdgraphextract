# MdGraphExtract

Extracts a graph from a Markdown file.

## Modes

MdGraphExtract has two operational modes:

### Autograph Mode `auto`

Extracts nodes and edges from headlines and internal links.

### DotExtract Mode `dotex`

Extracts DOT commands from HTML-comments under consideration of the last headline.

## Interface

You can use MdGraphExtract in any Node.JS project, but it has additional support for Gulp.

### Usage with Gulp

```js
var gulp = require('gulp');
var spawn = require('gulp-spawn');
var mdgraphextract = require('mdgraphextract');

gulp.task('autograph', function() {
	// grab all Markdown files in the docs folder
	return gulp.src('docs/*.md')
		// pipe them to MdGraphExtract in Autograph mode
		.pipe(mdgraphextract({ mode: 'auto' }))
		// write the resulting *.gv files to the docs folder
		.pipe(gulp.dest('docs/'))
		// use `dot` from GraphViz to render the graphs into PNG files
		.pipe(spawn({
			cmd: 'dot',
			args: ['-Tpng'],
			filename: function(base, ext) { return base + '.png'; }
		}))
		// write the PNG files to the docs folder
		.pipe(gulp.dest('docs/'));
});
```

### Usage with as a function

Additional to the main function, which processes Vinyl files and is usable in Gulp files, there is a simple asynchronous `extract()` function.

`extract(data[, opt], cb)`

The `opt` object can have the `mode` attribute with `"auto"` or `"dotex"` as value. And it can have the `encoding` attribute with an input encoding, in case the input is binary.

Mini-Example with the `extract()` function:

```js
var fs = require('fs');
var mdgraphextract = require('mdgraphextract');

var buffer = fs.readFileSync('test.md');
mdgraphextract.extract(buffer, 
    { encoding: 'utf8', mode: 'dotex' },
    function(result) {
        fs.writeFileSync('test.gv', result, { encoding: 'utf8' });
    });
```

The `extract()` function can take a string, a buffer, or a stream as input. The second argument with the options is optional. The encoding is `utf8` by default. The graph extraction mode is `auto` by default.

### Usage as a readable stream

At last MdGraphExtract provides the pseudo-class `ExtractingStream`.

`new ExtractingStream(input[, opt])`

The `opt` object can have the `mode` attribute with `"auto"` or `"dotex"` as value. And it can have the `encoding` attribute with an input encoding, in case the input is binary.

Mini-Example with the `ExtractingStream` pseudo-class:

```js
var fs = require('fs');
var ExtractingStream = require('mdgraphextract').ExtractingStream;

var s = new ExtractingStream(fs.createReadStream('test.md', 'utf8'));
s.pipe(fs.createWriteStream('test.gv', 'utf8'));
```

The `ExtractingStream` pseudo-class is constructed with a `Readable` stream as input. The second argument with the options is optional.