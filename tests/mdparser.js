var test = require('tape').test;
var fs = require('fs');

var MdParser = require('../src/mdparser');

var checkObjectArray = function(t, result, expected) {
	var i;
	t.ok(result, 'result should be truthy');
	t.ok(result instanceof Array, 'result should be an array');
	t.equal(result.length, expected.length, 'result has the right length');
	for (i = 0; i < expected.length; i++) {
		t.deepEqual(result[i], expected[i], 'array item should be equal');
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
		{ target: 'Headline', text: 'First Headline' },
		{ target: 'Headline', text: 'Headline' },
		{ target: 'Headline', text: 'Headline' },
		{ target: 'Headline', text: 'links' },
		{ target: 'Headline', text: 'one' },
		{ target: 'Headline', text: 'Headline' },
		{ target: 'Headline', text: 'last' },
		{ target: 'Headline', text: 'very last 1' },
		{ target: 'Headline', text: 'very last 2' }
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
		{ text: 'http://www.theendoftheinternet.com/', url: 'http://www.theendoftheinternet.com/' },
		{ text: 'mailto:link@xyz.com', url: 'mailto:link@xyz.com' },
		{ text: 'URL', url: '../test.html' },
		{ text: 'link', url: 'ftp://link' },
		{ text: 'hidden', url: 'hidden.txt' },
		{ text: 'link', url: 'link.txt' },
		{ text: 'link2.txt', url: 'link2.txt' }
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

test('MdParser code', function(t) {
	var expected = [
		'start',
		{ text: '<code 1>' },
		{ text: '' },
		{ text: '// <code 3>' },
		{ text: '  <code 3.1>' },
		{ text: '    <code 3.1.1>' },
		'end',
		'start',
		{ text: '<code 4>' },
		{ text: '# <code 5>' },
		{ text: '' },
		'end'
	];

	var p = new MdParser();
	var result = [];
	p.on('code', function(hl) { result.push(hl); });
	p.on('startCode', function() { result.push('start'); });
	p.on('endCode', function() { result.push('end'); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});

	p.parse(fs.createReadStream('tests/data/code.md'));
});

test('MdParser comments', function(t) {
	var expected = [
		{ text: ' a comment', inline: true },
		{ text: '@', inline: true },
		{ text: ' Comment 1 ', inline: true },
		{ text: ' Comment 2 ', inline: true },
		{ text: ' Comment 3 ', inline: true },
		'start',
		{ text: ' Start', inline: false },
		{ text: 'This is a comment --', inline: false },
		{ text: 'with no end -> ', inline: false },
		{ text: 'This is end ', inline: false },
		'end',
		'start',
		{ text: 'Whats going on', inline: false },
		{ text: '', inline: false },
		{ text: '\tcomment no code', inline: false },
		{ text: '\tcomment 2 no code', inline: false },
		{ text: '', inline: false },
		'end',
		{ text: 'comment', inline: true },
		'start',
		{ text: 'multiline ', inline: false },
		'end'
	];

	var p = new MdParser();
	var result = [];
	p.on('comment', function(hl) { result.push(hl); });
	p.on('startComment', function() { result.push('start'); });
	p.on('endComment', function() { result.push('end'); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});

	p.parse(fs.createReadStream('tests/data/comments.md'));
});