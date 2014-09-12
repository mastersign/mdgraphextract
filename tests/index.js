var test = require('tape').test;
var fs = require('fs');
var path = require('path');
var File = require('vinyl');

var graphextract = require('../src/index');

var autographResult = 
	'digraph G {\n' +
	'\t"1 Hädline";\n' +
	'\t"1 Hädline" -> "Subßection A";\n' +
	'\t"1 Hädline" -> "Subsection B";\n' +
	'\t"2 Headline";\n' +
	'\t"Subßection A";\n' +
	'\t"Subßection A" -> "2 Headline";\n' +
	'\t"Subsection B";\n' +
	'\t"Subsection B" -> "1 Hädline";\n' +
	'}\n';

var autographResult2 =
	'digraph G {\n' +
	'\t"Subßection A" [URL="target.html#subßection-a"];\n' +
	'\t"Subßection A" -> "2 Headline";\n' +
	'\t"Subsection B" [URL="target.html#subsection-b"];\n' +
	'\t"Subsection B" -> "1 Hädline";\n' +
	'}\n';

test('graphextract.ExtractingStream text: autograph mode', function(t) {
	var s = new graphextract.ExtractingStream(
		fs.createReadStream('tests/data/doc_autograph.md', 'utf8'),
		{ noAutoRefs: true });

	var result = '';

	s.on('end', function() {
		t.equals(result, autographResult, 'dot output equals expectation');
		t.end();
	});
	s.on('data', function(data) {
		result = result + data;
	});
});

test('graphextract.ExtractingStream binary: autograph mode', function(t) {
	var s = new graphextract.ExtractingStream(
		fs.createReadStream('tests/data/doc_autograph.md'),
		{ noAutoRefs: true });

	var result = '';

	s.on('end', function() {
		t.equals(result, autographResult, 'dot output equals expectation');
		t.end();
	});
	s.on('data', function(data) {
		result = result + data;
	});
});

test('graphextract.extract() with string: autograph mode', function(t) {
	var text = fs.readFileSync('tests/data/doc_autograph.md', 'utf8');

	graphextract.extract(text, { noAutoRefs: true }, function(result) {
		t.equals(result, autographResult, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract.extract() with string: autograph mode (level = 2)', function(t) {
	var text = fs.readFileSync('tests/data/doc_autograph.md', 'utf8');

	graphextract.extract(text, { autographLevel: 2, refPrefix: 'target.html' }, function(result) {
		t.equals(result, autographResult2, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract.extract() with buffer: autograph mode', function(t) {
	var buffer = fs.readFileSync('tests/data/doc_autograph.md');

	graphextract.extract(buffer, { encoding: 'utf8', noAutoRefs: true }, function(result) {
		t.equals(result.toString('utf8'), autographResult, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract() should pass empty files', function(t) {
	var f = { isNull: function() { return true; } }
	var ge = graphextract();
	t.plan(1);
	ge.on('data', function(data) {
		t.equals(data, f);
	});
	ge.on('end', function() {
		t.end();
	});
	ge.write(f);
	ge.end();
});

test('graphextract() with file buffer', function(t) {
	var f = new File({
		cwd: 'tests/',
		base: 'data/',
		path: 'data/doc_autograph.md',
		contents: fs.readFileSync('tests/data/doc_autograph.md')
	});

	var result = '';
	var ge = graphextract({ encoding: 'utf8', noAutoRefs: true });
	t.plan(2);
	ge.on('data', function(data) {
		t.ok(data.isBuffer(), 'content is a buffer');
		t.equals(data.contents.toString('utf8'), autographResult, 'dot output equals expectation');
	});
	ge.on('end', function() {
		t.end();
	});
	ge.write(f);
	ge.end();
});

test('graphextract() with file stream', function(t) {
	var f = new File({
		cwd: 'tests/',
		base: 'data/',
		path: 'data/doc_autograph.md',
		contents: fs.createReadStream('tests/data/doc_autograph.md')
	});

	var result = '';
	var ge = graphextract({ encoding: 'utf8', noAutoRefs: true });
	t.plan(2);
	ge.on('data', function(data) {
		t.ok(data.isStream(), 'content is a stream');
		data.contents.on('data', function(data) {
			result = result + data;
		});
		data.contents.on('end', function() {
			t.equals(result, autographResult, 'dot output equals expectation');
		});
	});
	ge.on('end', function() {
		t.end();
	});
	ge.write(f);
});

test('graphextract() change file name extension', function(t) {
	var f = new File({
		cwd: 'tests/',
		base: 'data/',
		path: 'data/doc_autograph.md',
		contents: fs.readFileSync('tests/data/doc_autograph.md')
	});

	var result = '';
	var ge = graphextract();
	t.plan(1);
	ge.on('data', function(data) {
		t.equals(path.extname(data.path), '.gv');
	});
	ge.on('end', function() {
		t.end();
	});
	ge.write(f);
	ge.end();
});

test('graphextract.extract() with string: dotex mode, empty named graph', function(t) {
	var text = '<!-- @g Graph -->';
	var expected = 
		'digraph "Graph" {\n' +
		'}\n';

	graphextract.extract(text, { mode: 'dotex' }, function(result) {
		t.equals(result, expected, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract.extract() with string: dotex mode, graph attributes', function(t) {
	var text = '<!-- @g size="1, 1" -->';
	var expected = 
		'digraph G {\n' +
		'\tsize="1, 1";\n' +
		'}\n';

	graphextract.extract(text, { mode: 'dotex' }, function(result) {
		t.equals(result, expected, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract.extract() with string: dotex mode, named graph with attributes', function(t) {
	var text = '<!-- @g Graph: size="1, 1" fontname=Helvetica -->';
	var expected = 
		'digraph "Graph" {\n' +
		'\tsize="1, 1";\n' +
		'\tfontname=Helvetica;\n' +
		'}\n';

	graphextract.extract(text, { mode: 'dotex' }, function(result) {
		t.equals(result, expected, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract.extract() with string: dotex mode, node attributes', function(t) {
	var text = 
		'<!-- @na fillcolor="#000000" color="#FF0000" -->' +
		'<!-- @nt type1: color="#FFFFFF" -->' +
		'<!-- @n abc <type1>: style=box -->';
	var expected = 
		'digraph G {\n' +
		'\tnode [color="#FF0000" fillcolor="#000000"];\n' +
		'\t"abc" [color="#FFFFFF" style=box];\n' +
		'}\n';

	graphextract.extract(text, { mode: 'dotex' }, function(result) {
		t.equals(result, expected, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract.extract() with string: dotex mode, context node', function(t) {
	var text = 
		'# H1\n' +
		'<!-- @node -->';
	var expected = 
		'digraph G {\n' +
		'\t"H1" [URL="#h1"];\n' +
		'}\n';

	graphextract.extract(text, { mode: 'dotex' }, function(result) {
		t.equals(result, expected, 'dot output equals expectation');
		t.end();
	});
});


test('graphextract.extract() with string: dotex mode, edge attributes', function(t) {
	var text = 
		'<!-- @ea color="#FF0000" style=dashed -->' +
		'<!-- @et type1: color="#FFFFFF" -->' +
		'<!-- @e A -> B <type1>: arrowhead="vee" -->';
	var expected = 
		'digraph G {\n' +
		'\tedge [color="#FF0000" style=dashed];\n' +
		'\t"A" -> "B" [arrowhead=vee color="#FFFFFF"];\n' +
		'}\n';

	graphextract.extract(text, { mode: 'dotex' }, function(result) {
		t.equals(result, expected, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract.extract() with string: dotex mode, context edge', function(t) {
	var text = 
		'# H1\n' +
		'<!-- @e -> H2 -->';
	var expected = 
		'digraph G {\n' +
		'\t"H1" -> "H2";\n' +
		'}\n';

	graphextract.extract(text, { mode: 'dotex' }, function(result) {
		t.equals(result, expected, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract.extract() with string: dotex mode, doc_dotex', function(t) {
	var text = fs.readFileSync('tests/data/doc_dotex.md', 'utf8');
	var expected = 
		'digraph "Graph" {\n' +
		'\tcenter=true;\n' +
		'\tnode [color="#00FF00" fillcolor="#0000FF" style=filled];\n' +
		'\tedge [color="#000000"];\n' + 
		'\t"H1" [URL="#h1"];\n' +
		'\t"H1" -> "SH12" [color="#FF0000"];\n' +
		'\t"SH11" [color="#FFFF00" URL="#sh11"];\n' +
		'\t"SH11" -> "H1";\n' +
		'\t"SH12" [color="#FF0000" URL="#sh12"];\n' +
		'\t"SH12" -> "SH11" [color="#00FFFF"];\n' +
		'\t"SH11" -> "SH12" [color="#00FFFF" style=dashed];\n' +
		'}\n';

	graphextract.extract(text, { mode: 'dotex' }, function(result) {
		t.equals(result, expected, 'dot output equals expectation');
		t.end();
	});
});
