var test = require('tape').test;
var fs = require('fs');

var MdParser = require('../src/mdparser');

var checkObjectArray = function(t, result, expected) {
	var i;
	t.ok(result, 'result is truthy');
	t.ok(result instanceof Array, 'result is an array');
	t.equal(result.length, expected.length);
	for (i = 0; i < expected.length; i++) {
		t.deepEqual(result[i], expected[i], 'object in array should be equivalent');
	}
};

test('MdParser headlines', function(t) {
	var expected = [
		{ text: "Main Headline", level: 1 },
		{ text: "Subsection", level: 2 },
		{ text: "(01) Headline {#first_hl}", level: 1 },
		{ text: "1.2 _Headline_ **2**", level: 2 },
		{ text: "Headline <http://www.endoftheinternet.com/>", level: 3 },
		{ text: "Headline [hl1](#first_hl), [hl1][(01) Headline], [(01) Headline][], [(01) Headline] - []", level: 1 },
		{ text: "the last headline", level: 4 }
	];

	var p = new MdParser();
	var result = [];
	p.on('headline', function(hl) { result.push(hl); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});

	p.parse(fs.createReadStream('tests/data/headlines.md'));
});

test('MdParser internal links', function(t) {
	var expected = [
		// TODO
	];

	var p = new MdParser();
	var result = [];
	p.on('internal-link', function(hl) { result.push(hl); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});

	p.parse(fs.createReadStream('tests/data/internal-links.md'));
});

test('MdParser links', function(t) {
	var expected = [
		// TODO
	];

	var p = new MdParser();
	var result = [];
	p.on('link', function(hl) { result.push(hl); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});

	p.parse(fs.createReadStream('tests/data/links.md'));
});

test('MdParser comments', function(t) {
	var expected = [
		// TODO
	];

	var p = new MdParser();
	var result = [];
	p.on('comment', function(hl) { result.push(hl); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});

	p.parse(fs.createReadStream('tests/data/comments.md'));
});