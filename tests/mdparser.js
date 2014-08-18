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
		{ source: "Main Headline", 
		  text: "Main Headline", 
		  anchor: "main-headline",
		  level: 1, 
		  row: 3, column: 1 },
		{ source: "Subsection",
		  text: "Subsection",
		  anchor: "subsection",
		  level: 2,
		  row: 6, column: 1 },
		{ source: "(01) Headline {#first_hl}",
		  text: "(01) Headline",
		  anchor: "first_hl",
		  level: 1,
		  row: 15, column: 1 },
		{ source: "1.2 _Headline_ **2**",
		  text: "1.2 Headline 2",
		  anchor: "headline-2",
		  level: 2, row: 17, column: 1 },
		{ source: "Headline <http://www.endoftheinternet.com/>",
		  text: "Headline http://www.endoftheinternet.com/",
		  anchor: "headline-httpwww.endoftheinternet.com",
		  level: 3,
		  row: 20, column: 1 },
		{ source: "Headline [hl1](#first_hl), [hl1][(01) Headline], [(01) Headline][], [(01) Headline] - []",
		  text: "Headline hl1, hl1, (01) Headline, (01) Headline - []",
		  anchor: "headline-hl1-hl1-01-headline-01-headline---",
		  level: 1,
		  row: 22, column: 1 },
		{ source: "the last headline",
		  text: "the last headline",
		  anchor: "the-last-headline",
		  level: 4, 
		  row: 28, column: 1 },
		{ source: "Subsection",
		  text: "Subsection",
		  anchor: "subsection_1",
		  level: 2,
		  row: 30, column: 1 },
		{ source: "Subsection",
		  text: "Subsection",
		  anchor: "subsection_2",
		  level: 2,
		  row: 32, column: 1 }
	];

	var p = new MdParser(fs.createReadStream('tests/data/headlines.md'));
	var result = [];
	p.on('headline', function(hl) { result.push(hl); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});
});

test('MdParser internal links', function(t) {
	var expected = [
		{ target: 'Headline', targetText: 'Headline', text: 'First Headline', row: 3, column: 1 },
		{ target: 'Headline', targetText: 'Headline', text: 'Headline', row: 4, column: 5 },
		{ target: 'Headline', targetText: 'Headline', text: 'Headline', row: 5, column: 5 },
		{ target: 'Headline', targetText: 'Headline', text: 'links', row: 7, column: 10 },
		{ target: 'Headline', targetText: 'Headline', text: 'one', row: 7, column: 31 },
		{ target: 'Headline', targetText: 'Headline', text: 'Headline', row: 7, column: 47 },
		{ target: 'Headline', targetText: 'Headline', text: 'last', row: 9, column: 23 },
		{ target: 'Headline', targetText: 'Headline', text: 'very last 1', row: 15, column: 28 },
		{ target: 'Headline', targetText: 'Headline', text: 'very last 2', row: 17, column: 25 }
	];

	var p = new MdParser(fs.createReadStream('tests/data/internal-links.md'));
	var result = [];
	p.on('internal-link', function(hl) { result.push(hl); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});
});

test('MdParser links', function(t) {
	var expected = [
		{ text: 'http://www.theendoftheinternet.com/', 
		  url: 'http://www.theendoftheinternet.com/',
		  row: 1, column: 12 },
		{ text: 'mailto:link@xyz.com', url: 'mailto:link@xyz.com',
		  row: 3, column: 23 },
		{ text: 'URL', url: '../test.html', row: 4, column: 5 },
		{ text: 'link', url: 'ftp://link', row: 8, column: 1 },
		{ text: 'hidden', url: 'hidden.txt', row: 8, column: 43 },
		{ text: 'http://www.example.com', url: 'http://www.example.com', row: 13, column: 1 },
		{ text: 'link', url: 'link.txt', row: 18, column: 13 },
		{ text: 'file://link2.txt', url: 'file://link2.txt', row: 18, column: 31 }
	];

	var p = new MdParser(fs.createReadStream('tests/data/links.md'));
	var result = [];
	p.on('link', function(hl) { result.push(hl); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});
});

test('MdParser code', function(t) {
	var expected = [
		{ typ: 'start', row: 9, column: 1 },
		{ text: '<code 1>', row: 9, column: 1 },
		{ text: '', row: 10, column: 1 },
		{ text: '// <code 3>', row: 11, column: 1 },
		{ text: '  <code 3.1>', row: 12, column: 1 },
		{ text: '    <code 3.1.1>', row: 13, column: 1 },
		{ typ: 'end', row: 13, column: 21 },
		{ typ: 'start', row: 15, column: 1 },
		{ text: '<code 4>', row: 15, column: 1 },
		{ text: '# <code 5>', row: 16, column: 1 },
		{ text: '', row: 17, column: 1 },
		{ typ: 'end', row: 17, column: 2 }
	];

	var p = new MdParser(fs.createReadStream('tests/data/code.md'));
	var result = [];
	p.on('code', function(hl) { result.push(hl); });
	p.on('startCode', function(e) { e.typ = 'start'; result.push(e); });
	p.on('endCode', function(e) { e.typ = 'end'; result.push(e); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});
});

test('MdParser comments', function(t) {
	var expected = [
		{ text: ' a comment', inline: true, row: 2, column: 22 },
		{ text: '@', inline: true, row: 2, column: 44 },
		{ text: ' Comment 1 ', inline: true, row: 6, column: 1 },
		{ text: ' Comment 2 ', inline: true, row: 7, column: 1 },
		{ text: ' Comment 3 ', inline: true, row: 7, column: 19 },
		{ typ: 'start', row: 9, column: 1 },
		{ text: ' Start', inline: false, row: 9, column: 1 },
		{ text: 'This is a comment --', inline: false, row: 10, column: 1 },
		{ text: 'with no end -> ', inline: false, row: 11, column: 1 },
		{ text: 'This is end ', inline: false, row: 12, column: 1 },
		{ typ: 'end', row: 12, column: 16 },
		{ typ: 'start', row: 14, column: 1 },
		{ text: 'Whats going on', inline: false, row: 15, column: 1 },
		{ text: '', inline: false, row: 16, column: 1 },
		{ text: '\tcomment no code', inline: false, row: 17, column: 1 },
		{ text: '\tcomment 2 no code', inline: false, row: 18, column: 1 },
		{ text: '', inline: false, row: 19, column: 1 },
		{ typ: 'end', row: 20, column: 4 },
		{ text: 'comment', inline: true, row: 22, column: 9 },
		{ typ: 'start', row: 22, column: 28 },
		{ text: 'multiline ', inline: false, row: 23, column: 1 },
		{ typ: 'end', row: 23, column: 14 }
	];

	var p = new MdParser(fs.createReadStream('tests/data/comments.md'));
	var result = [];
	p.on('comment', function(hl) { result.push(hl); });
	p.on('startComment', function(e) { e.typ = 'start'; result.push(e); });
	p.on('endComment', function(e) { e.typ = 'end'; result.push(e); });
	p.on('end', function() {
		checkObjectArray(t, result, expected);
		t.end();
	});
});