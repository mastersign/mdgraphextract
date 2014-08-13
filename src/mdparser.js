var util = require('util');
var EventEmitter = require('events').EventEmitter;
var lines = require('./lines');

var headlinePattern = /^(#+)\s+(.*?)\s*$/;
var headline1Pattern = /^==+\s*$/;
var headline2Pattern = /^--+\s*$/;

var internalLink1Pattern = /\[([^\]]+)\](?:\[\]|[^\[\(]|$)/g;
var internalLink2Pattern = /\[([^\]]+)\]\[([^\]]+)\]/g;

var externalLinkPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;

var commentPattern = /<!\-\-(.*?)\-\->/g;

var commentStartPattern = /<!\-\-(.*?)$/;
var commentEndPattern = /^(.*?)\-\->/;

var match = function(re, text, fn, maxIndex) {
	var m;
	var cnt = 0;
	re.lastIndex = 0;
	m = re.exec(text);
	if (re.global) {
		while(m) {
			if (maxIndex !== undefined && m.index > maxIndex) { break; }
			cnt = cnt + 1;
			fn(m);
			m = re.exec(text);
		}
	} else if (m) {
		if (maxIndex === undefined || m.index <= maxIndex) {
			cnt = cnt + 1;
			fn(m);
		}
	}
	return cnt;
};

var MdParser = function() { };
util.inherits(MdParser, EventEmitter);

MdParser.prototype.parse = function parse(input) {
	var that = this;

	var s = lines(input);
	if (s === undefined) {
		throw 'Input null or undefined.';
	}

	var lastLine = null;
	var commenStart = null;
	var inComment = false;

	s.on('end', function() {
		that.emit('end');
	});

	s.on('data', function(line) {
		
		// comments

		match(commentPattern, line, function(m) {
			that.emit('comment', {
				text: m[1]
			});
		});

		// headline

		match(headlinePattern, line, function(m) {
			that.emit('headline', { 
				level: m[1].length,
				text: m[2]
			});
		}) ||
		match(headline1Pattern, line, function(m) {
			that.emit('headline', {
				level: 1,
				text: lastLine
			});
		}) ||
		match(headline2Pattern, line, function(m) {
			that.emit('headline', {
				level: 2,
				text: lastLine
			});
		});

		// internal links

		match(internalLink1Pattern, line, function(m) {
			that.emit('internal-link', {
				text: m[1],
				target: m[1]
			});
		});

		match(internalLink2Pattern, line, function(m) {
			that.emit('internal-link', {
				text: m[1],
				target: m[2]
			});
		});

		// external links

		match(externalLinkPattern, line, function(m) {
			that.emit('link', {
				text: m[1],
				target: m[2]
			});
		});

		lastLine = line.trim();
	});
}

module.exports = MdParser;