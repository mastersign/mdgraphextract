# MdGraphExtract

Extracts a graph in DOT format from a Markdown file.

Author: Tobias Kiertscher <dev@mastersign.de>

License: [MIT License](http://opensource.org/licenses/MIT)

## Modes

*MdGraphExtract* has two operational modes:

### Autograph Mode `auto`

Extracts nodes and edges from headlines and internal links.

Example Markdown document:

```Markdown
# First Chapter
Text with an internal link to [Section 1.1] and [Section 1.2].

## Section 1.1
This section references [Second Chapter][].

## Section 1.2
This section stands for its own.

# Second Chapter
And here is a link to [the first chapter][First Chapter].
```

Resulting DOT file:

```DOT
digraph G {
    "First Chapter";
    "First Chapter" -> "Section 1.1";
    "First Chapter" -> "Section 1.2";
    "Section 1.1";
    "Section 1.1" -> "Second Chapter";
    "Section 1.2";
    "Second Chapter";
    "Second Chapter" -> "First Chapter";
}
```

Rendered with `dot` from *GraphViz*:

![](examples/autograph-example.png)

### DotExtract Mode `dotex`

Extracts DOT commands from HTML-comments under consideration of the last headline.

Example Markdown document:

```Markdown
<!-- 
@graph MyGraph: fontname=Helvetica
@node-attributes shape=rect style="filled, rounded" fillcolor=#A0D0FF
@edge-attributes color=#2040C0
@node-type important: fillcolor=#FFD0A0
@edge-type weak: style=dashed
-->

# First Chapter
<!-- @node -->
<!-- @edge -> Section 1.1 <weak> -->
<!-- @edge -> Section 1.2 <weak> -->
Text paragraph is weakly linked with Section 1.1 and 1.2.

## Section 1.1
<!-- @node <important>: label="Sect. (1.1)" -->
<!-- @edge -> Second Chapter -->
This section is linked to the Second Chapter.

## Section 1.2
<!-- @node label="Sect. (1.2)" -->
This section stands for its own.

<!-- @node Second Chapter: label="Chapter 2" -->
<!-- @edge Second Chapter -> First Chapter -->
# Second Chapter
And the last chapter is linked with the first chapter.
```

Resulting DOT file:

```DOT
digraph "MyGraph" {
    fontname=Helvetica;
    "First Chapter" [fillcolor="#A0D0FF" shape=rect style="filled, rounded" URL="#first-chapter"];
    "First Chapter" -> "Section 1.1" [color="#2040C0" style=dashed];
    "First Chapter" -> "Section 1.2" [color="#2040C0" style=dashed];
    "Section 1.1" [fillcolor="#FFD0A0" label="Sect. (1.1)" shape=rect style="filled, rounded" URL="#section-1.1"];
    "Section 1.1" -> "Second Chapter" [color="#2040C0"];
    "Section 1.2" [fillcolor="#A0D0FF" label="Sect. (1.2)" shape=rect style="filled, rounded" URL="#section-1.2"];
    "Second Chapter" [fillcolor="#A0D0FF" label="Chapter 2" shape=rect style="filled, rounded"];
    "Second Chapter" -> "First Chapter" [color="#2040C0"];
}
```

Rendered with `dot` from *GraphViz*:

![](examples/dotex-example.png)

## Interface

You can use *MdGraphExtract* in any *Node.JS* project, but it has additional support for *Gulp*.

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

Additional to the main function, which processes *Vinyl* files and is usable in *Gulp* files, there is a simple asynchronous `extract()` function.

`extract(data[, opt], cb)`

The `opt` object can have the `mode` attribute with `"auto"` or `"dotex"` as value. And it can have the `encoding` attribute with an input encoding, in case the input is binary. If the `mode` is set to `auto`, than the additional attribute `autographLevel` is recognized, which specifies the headline level to use as the link context.

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

At last *MdGraphExtract* provides the pseudo-class `ExtractingStream`.

`new ExtractingStream(input[, opt])`

The `opt` object can have the `mode` attribute with `"auto"` or `"dotex"` as value. And it can have the `encoding` attribute with an input encoding, in case the input is binary. If the `mode` is set to `auto`, than the additional attribute `autographLevel` is recognized, which specifies the headline level to use as the link context.

Mini-Example with the `ExtractingStream` pseudo-class:

```js
var fs = require('fs');
var ExtractingStream = require('mdgraphextract').ExtractingStream;

var s = new ExtractingStream(fs.createReadStream('test.md', 'utf8'));
s.pipe(fs.createWriteStream('test.gv', 'utf8'));
```

The `ExtractingStream` pseudo-class is constructed with a `Readable` stream as input. The second argument with the options is optional.
