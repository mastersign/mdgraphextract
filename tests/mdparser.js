var test = require('tap').test;
var fs = require('fs');

var MdParser = require('../mdparser');

test('headlines', function(t) {
	var expected = [
		{ text: "Hauptüberschrift", level: 1 },
		{ text: "Unterüberschrift", level: 2 },
		{ text: "01 Headline 1", level: 1 },
		{ text: "02 _Headline_ **2**", level: 2 }
	];

	var result = [];
	var p = new MdParser();
	p.on('headline', function(hl) {	result.push(hl); });
	p.on('end', function() {
		t.deepEqual(result, expected);
		t.end();
	});
	
	p.parse(fs.createReadStream('./headlines_01.md'));
});
