var util = require('util');
var EventEmitter = require('events').EventEmitter;
var mdheadline = require('mdheadline');
var lines = require('./lines');

var match = function (re, text, fn) {
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

var MdParser = function (input, encoding) {

	var headlinePattern = /^(#+)\s+(.*?)\s*$/;
	var headline1Pattern = /^==+\s*$/;
	var headline2Pattern = /^--+\s*$/;

	var internalLinkPattern = /(?:^|[^\]\)!])\[([^\]]+)\](?:\[([^\]]*)\])?/g;

	var externalLinkPattern = /(?:^|[^\]!])\[([^\]]+)\]\(([^\)]+)\)/g;
	var urlLinkPattern = /<([^>\s]+)>/g;

	var codePattern = /^(?: {4}|\t)(.*)$/;
	var fencedCodeStartPattern = /^(`{3,}|~{3,})\s*(.*?)\s*$/;

	var commentPattern = /<!--(.*?)-->/g;

	var commentStartPattern = /(?:<!--)(?!.*<!--)(.*?)$/;
	var commentEndPattern = /^(.*?)-->/;

	var citationPattern = /^ {0,3}(>[\s>]*)(.*)\s*$/;

	var that = this;

	var s = lines(input, encoding);
	s.pause();
	if (s === undefined) {
		throw 'Invalid input.';
	}
	s.setEncoding('utf8');
	that._inputStream = s;

	var row = 0;
	var lastLine = null;
	var inCode = false;
	var inFencedCode = false;
	var codeFence = null;
	var inComment = false;

	var anchorCache = {};

	var uniqueAnchor = function(anchor) {
		var cnt = anchorCache[anchor];
		if (cnt) {
			anchorCache[anchor] = cnt + 1;
			return anchor + '_' + cnt;
		}
		anchorCache[anchor] = 1;
		return anchor;
	};

	s.on('end', function() {
		that.emit('end');
	});

	s.on('data', function(line) {

		row = row + 1;
		
		var comments = [];
		var lastComment = null;
		var isInComment = function(m) {
			var i, cm;
			for (i = 0; i < comments.length; i++) {
				cm = comments[i];
				if (m.index >= cm.index && m.index < (cm.index + cm[0].length)) {
					return true;
				}
				return false;
			}
		};

		// code

		if (!inComment) {
			if (inFencedCode) {
				if (line === codeFence) {
					codeFence = null;
					inFencedCode = false;
					that.emit('endCode', {
						row: row - 1,
						column: lastLine.length + 1
					});
				} else {
					that.emit('code', {
						row: row,
						column: 1,
						text: line
					});
					lastLine = line;
					return;
				}
			} else {
				if (match(codePattern, line, function(m) {
					if (!inCode && lastLine.trim().length === 0 && m[1].length > 0) {
						inCode = true;
						that.emit('startCode', {
							row: row, 
							column: 1
						});
					}
					if (inCode) {
						that.emit('code', { 
							row: row,
							column: 1,
							text: m[1]
						});
					}
				}) > 0) {
					if (inCode) {
						lastLine = line;
						return; 
					}
				}
				if (inCode) {
					inCode = false;
					that.emit('endCode', { 
						row: row - 1, 
						column: lastLine.length + 1
					});
				}
				if (match(fencedCodeStartPattern, line, function(m) {
					inFencedCode = true;
					codeFence = m[1];
					that.emit('startCode', {
						row: row + 1,
						column: 1,
						codeAttributes: m[2] || ''
					});
				}) > 0) {
					if (inFencedCode) {
						lastLine = line;
						return;
					}
				}
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
				source: m[2],
				text: mdheadline.removeFormat(m[2]),
				anchor: uniqueAnchor(mdheadline.anchor(m[2]))
			});
		}) ||
		match(headline1Pattern, line, function(m) {
			if (isInComment(m)) return;
			that.emit('headline', {
				row: row - 1, 
				column: m.index + 1,
				level: 1,
				source: lastLine,
				text: mdheadline.removeFormat(lastLine),
				anchor: uniqueAnchor(mdheadline.anchor(lastLine))
			});
		}) ||
		match(headline2Pattern, line, function(m) {
			if (isInComment(m)) return;
			if (row === 1) return;
			that.emit('headline', {
				row: row - 1, 
				column: m.index + 1,
				level: 2,
				source: lastLine,
				text: mdheadline.removeFormat(lastLine),
				anchor: uniqueAnchor(mdheadline.anchor(lastLine))
			});
		});

		// citations

		match(citationPattern, line, function (m) {
			if (isInComment(m)) return;
			that.emit('citation', {
				text: m[2],
				level: m[1].replace(/\s/g, '').length,
				row: row,
				column: 1
			});
		});

		// internal links

		match(internalLinkPattern, line, function(m) {
			if (isInComment(m)) return;
			if (m[2]) {
				that.emit('internal-link', {
					row: row, 
					column: m.index > 0 ? m.index + 2 : m.index + 1,
					text: m[1],
					target: m[2],
					targetText: mdheadline.removeFormat(m[2])
				});
			} else {
				that.emit('internal-link', {
					row: row, 
					column: m.index > 0 ? m.index + 2 : m.index + 1,
					text: m[1],
					target: m[1],
					targetText: mdheadline.removeFormat(m[1])
				});
			}
		});

		// external links

		match(externalLinkPattern, line, function(m) {
			if (isInComment(m)) return;
			that.emit('link', {
				row: row, 
				column: m.index > 0 ? m.index + 2 : m.index + 1,
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
};
util.inherits(MdParser, EventEmitter);

MdParser.prototype.pause = function() {
	this._inputStream.pause();
};

MdParser.prototype.resume = function() {
	this._inputStream.resume();
};

module.exports = MdParser;