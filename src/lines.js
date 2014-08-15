var util = require('util');
var Readable = require('stream').Readable;
var split = require('split-stream');

var TextSplitter = function(text) {
	Readable.call(this, { objectMode: true });
	this._text = text;
	this._nl = /\r?\n/g;
	this._p = 0;
};
util.inherits(TextSplitter, Readable);

TextSplitter.prototype._read = function() {
	var part;
	match = this._nl.exec(this._text);
	if (match) {
		part = this._text.slice(this._p, match.index);
		this.push(part);
		this._p = match.index + match[0].length;
		this._nl.lastIndex = this._p;
	} else {
		part = this._text.slice(this._p, this._text.length);
		this.push(part);
		this.push(null);
	}
};

var lines = function(input, encoding) {
	encoding = encoding || 'utf8';
	if (input === null || input === undefined) {
		return;
	} else if (typeof(input) === 'string') {
		return new TextSplitter(input);
	} else if (input instanceof Buffer) {
		return new TextSplitter(input.toString(encoding));
	} else if (input instanceof Readable) {
		input.setEncoding(encoding);
		return input.pipe(split.create());
	} else {
		throw 'Input not supported.';
	}
};

module.exports = lines;