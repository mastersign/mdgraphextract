var util = require('util');
var Readable = require('stream').Readable;
var split = require('split-stream');

var TextSplitter = function(text) {
	Readable.call(this, { objectMode: true });
	var that = this;
	this._text = text;
	this._nl = /\r?\n/g;
	this._p = 0;
};
util.inherits(TextSplitter, Readable);

TextSplitter.prototype._read = function() {
	match = this._nl.exec(this._text);
	if (match) {
		this.push(this._text.slice(this._p, match.index));
		this._p = match.index + match[0].length;
		this._nl.lastIndex = this._p;
	} else {
		this.push(this._text.slice(this._p, this._text.length));
		this.push(null);
	}
};

var lines = function(input) {
	if (input === null || input === undefined) {
		return;
	} else if (typeof(input) === 'string') {
		return new TextSplitter(input);
	} else if (input instanceof Buffer) {
		return new TextSplitter(input.toString());
	} else if (input instanceof Readable) {
		return input.pipe(split.create());
	} else {
		throw 'Input not supported.';
	}
};

module.exports = lines;