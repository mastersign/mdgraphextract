var util = require('util');
var EventEmitter = require('events').EventEmitter;
var lines = require('./lines');

var headlinePattern = /^(#+)\s+(.*?)\s*$/;
var headline1Pattern = /^==+\s*$/;
var headline2Pattern = /^--+\s*$/;

var internalLinkPattern = /(?:^|[^\]\)])\[([^\]]+)\](?:\[([^\]]*)\])?/g;

var externalLinkPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;
var urlLinkPattern = /<([^>\s]+)>/g;

var codePattern = /^(?: {4}|\t)(.*)$/;

var commentPattern = /<!--(.*?)-->/g;

var commentStartPattern = /(?:<!--)(?!.*<!--)(.*?)$/;
var commentEndPattern = /^(.*?)-->/;

var match = function(re, text, fn) {
	var m;
	var cnt = 0;
	re.lastIndex = 0;
	m = re.exec(text);
	if (re.global) {
		while(m) {
			cnt = cnt + 1;
			fn(m);
			m = re.exec(text);
		}
	} else if (m) {
		cnt = cnt + 1;
		fn(m);
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

	var row = 0;
	var lastLine = null;
	var inCode = false;
	var inComment = false;

	s.on('end', function() {
		that.emit('end');
	});

	s.on('data', function(line) {

		row = row + 1;

		var comments = [];
		var lastComment = null;
		var isInComment = function(m) {
			var i;
			for (i = 0; i < comments.length; i++) {
				cm = comments[i];
				if (m.index >= cm.index && m.index < (cm.index + cm[0].length)) {
					return true;
				}
				return false;
			}
		}
		
		// code

		if (!inComment) {
			if (match(codePattern, line, function(m) {
				if (!inCode && lastLine.trim().length > 0) {
					return;
				}
				if (!inCode && m[1].length === 0) {
					return;
				}
				if (!inCode) {
					inCode = true;
					that.emit('startCode', {
						row: row, 
						column: 1
					});
				}
				that.emit('code', { 
					row: row,
					column: 1,
					text: m[1]
				});
				
			})) {
				lastLine = line;
				return; 
			}
			if (inCode) {
				that.emit('endCode', { 
					row: row - 1, 
					column: lastLine.length + 1
				});
				inCode = false;
			}
		}

		// comments

		if (inComment) {
			match(commentEndPattern, line, function(m) {
				comments.push(m);
				if (m[1].length > 0) {
					that.emit('comment', {
						row: row,
						column: m.index + 1,
						text: m[1],
						inline: false
					});
				}
				inComment = false;
				that.emit('endComment', { 
					row: row,
					column: m.index + m[0].length + 1,
				});
			});
			if (inComment) {
				that.emit('comment', {
					row: row,
					column: 1,
					text: line,
					inline: false
				});
				return;
			}
		}

		match(commentPattern, line, function(m) {
			that.emit('comment', {
				row: row,
				column: m.index + 1,
				text: m[1],
				inline: true
			});
			comments.push(m);
			lastComment = m.index + m[0].length;
		});

		match(commentStartPattern, line, function(m) {
			if (lastComment !== null && m.index < lastComment) {
				return;
			}
			inComment = true;
			that.emit('startComment', {
				row: row,
				column: m.index + 1
			});
			comments.push(m);
			if (m[1].length > 0) {
				that.emit('comment', {
					row: row,
					column: m.index + 1,
					text: m[1],
					inline: false
				});
			}
		});

		// headline

		match(headlinePattern, line, function(m) {
			if (isInComment(m)) return;
			that.emit('headline', { 
				row: row, 
				column: m.index + 1,
				level: m[1].length,
				text: m[2]
			});
		}) ||
		match(headline1Pattern, line, function(m) {
			if (isInComment(m)) return;
			that.emit('headline', {
				row: row - 1, 
				column: m.index + 1,
				level: 1,
				text: lastLine
			});
		}) ||
		match(headline2Pattern, line, function(m) {
			if (isInComment(m)) return;
			that.emit('headline', {
				row: row - 1, 
				column: m.index + 1,
				level: 2,
				text: lastLine
			});
		});

		match(internalLinkPattern, line, function(m) {
			if (isInComment(m)) return;
			if (m[2]) {
				that.emit('internal-link', {
					row: row, 
					column: m.index > 0 ? m.index + 2 : m.index + 1,
					text: m[1],
					target: m[2]
				});
			} else {
				that.emit('internal-link', {
					row: row, 
					column: m.index > 0 ? m.index + 2 : m.index + 1,
					text: m[1],
					target: m[1]
				});
			}
		});

		// external links

		match(externalLinkPattern, line, function(m) {
			if (isInComment(m)) return;
			that.emit('link', {
				row: row, 
				column: m.index + 1,
				text: m[1],
				url: m[2]
			});
		});

		match(urlLinkPattern, line, function(m) {
			if (isInComment(m)) return;
			that.emit('link', {
				row: row, 
				column: m.index + 1,
				text: m[1],
				url: m[1]
			});
		});

		lastLine = line.trim();
	});
}

module.exports = MdParser;