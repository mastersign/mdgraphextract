var util = require('util');
var EventEmitter = require('events').EventEmitter;
var lines = require('./lines');

var headlinePattern = /^(#+)\s+(.*?)\s*$/;

var MdParser = function() { };
util.inherits(MdParser, EventEmitter);

MdParser.prototype.parse = function parse(input) {
	var that = this;

	var s = lines(input);
	if (s === undefined) {
		throw 'Input null or undefined.';
	}

	var lastLine = null;

	s.on('end', function() {
		that.emit('end');
	});

	s.on('data', function(line) {
		var headlineMatch;

		// headline
		headlineMatch = headlinePattern.exec(line);
		if (headlineMatch) {
			that.emit('headline', { 
				level: headlineMatch[1].length,
				text: headlineMatch[2]
			});
		}
	});
}

module.exports = MdParser;