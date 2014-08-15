var test = require('tape').test;
var fs = require('fs');
var File = require('vinyl');

var graphextract = require('../src/index');

var autographResult =
	'digraph G {\n' +
	'\tnode: "1 Hädline"\n' +
	'\tedge: "1 Hädline" -> "Subßection A"\n' +
	'\tedge: "1 Hädline" -> "Subsection B"\n' +
	'\tnode: "2 Headline"\n' +
	'\tnode: "Subßection A"\n' +
	'\tedge: "Subßection A" -> "2 Headline"\n' +
	'\tnode: "Subsection B"\n' +
	'\tedge: "Subsection B" -> "1 Hädline"\n' +
	'}\n';

test('graphextract.ExtractingStream text: autograph mode', function(t) {
	var s = new graphextract.ExtractingStream(fs.createReadStream('tests/data/doc_autograph.md', 'utf8'));

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
	var s = new graphextract.ExtractingStream(fs.createReadStream('tests/data/doc_autograph.md'));

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

	graphextract.extract(text, function(result) {
		t.equals(result, autographResult, 'dot output equals expectation');
		t.end();
	});
});

test('graphextract.extract() with buffer: autograph mode', function(t) {
	var buffer = fs.readFileSync('tests/data/doc_autograph.md');

	graphextract.extract(buffer, {encoding: 'utf8'}, function(result) {
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
});

test('graphextract() with file buffer', function(t) {
	var f = new File({
		cwd: 'tests/',
		base: 'data/',
		path: 'data/doc_autograph.md',
		contents: fs.readFileSync('tests/data/doc_autograph.md')
	});

	var result = '';
	var ge = graphextract({ encoding: 'utf8' });
	t.plan(2);
	ge.on('data', function(data) {
		t.ok(data.isBuffer(), 'content is a buffer');
		t.equals(data.contents.toString('utf8'), autographResult, 'dot output equals expectation');
	});
	ge.on('end', function() {
		t.end();
	});
	ge.write(f);
});

test('graphextract() with file stream', function(t) {
	var f = new File({
		cwd: 'tests/',
		base: 'data/',
		path: 'data/doc_autograph.md',
		contents: fs.createReadStream('tests/data/doc_autograph.md')
	});

	var result = '';
	var ge = graphextract({ encoding: 'utf8' });
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
