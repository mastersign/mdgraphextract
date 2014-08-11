var util = require('util');
var EventEmitter = require('events').EventEmitter;
var lines = require('./lines');

var headlinePattern = /^(#+)\s+(.*?)\s*$/;
var headline1Pattern = /^==+\s*$/;
var headline2Pattern = /^--+\s*$/;


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
		
		// headline

		var headlineMatch = headlinePattern.exec(line),
			headline1Match = headline1Pattern.exec(line),
			headline2Match = headline2Pattern.exec(line);

		if (headlineMatch) {
			that.emit('headline', { 
				level: headlineMatch[1].length,
				text: headlineMatch[2]
			});
		} else if (headline1Match && lastLine) {
			that.emit('headline', {
				level: 1,
				text: lastLine
			});
		} else if (headline2Match && lastLine) {
			that.emit('headline', {
				level: 2,
				text: lastLine
			});
		}

		lastLine = line.trim();
	});
}

module.exports = MdParser;