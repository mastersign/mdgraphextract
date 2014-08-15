var through = require('through2');
var Readable = require('stream').Readable;
var util = require('util');
var panclean = require('./panclean');

var MdParser = require('./mdparser');

var autograph = function(es) {
	var node = null;

	es.push('digraph G {\n');

	es._parser.on('headline', function(e) {
		node = e.text;
		es.push('\tnode: "' + node + '"\n');
	});
	es._parser.on('internal-link', function(e) {
		var target = panclean.removeFormat(e.target)
		if (node) {
			es.push('\tedge: "' + node + '" -> "' + target + '"\n');
		}
	});

	es._parser.on('end', function() {
		es.push('}\n');
		es.push(null);
	})
};

var ExtractingStream = function(input, opt) {
	var that = this;
	var readableOpt = {};
	opt = opt || {};

	readableOpt.encoding = opt.encoding;
	readableOpt.objectMode = false;
	Readable.call(this, readableOpt);

	that._parser = new MdParser(input, opt.encoding);

	if ((opt.mode || 'auto') === 'auto') {
		autograph(that);
	} else {
		throw "Unsupported mode.";
	}
};
util.inherits(ExtractingStream, Readable);

ExtractingStream.prototype._read = function() {
	this._parser.resume();
};

/**
 * extract(data, cb)
 * extract(data, opt, cb)
 */
var extract = function(data) {
	if (arguments.length < 2 || arguments.length > 3) {
		throw 'Invalid number of arguments: extract(data, [opt,] cb)';
	}
	if (!(typeof(data) === 'string' || data instanceof Buffer)) {
		throw 'Invalid type of data. It must be a string or a Buffer.';
	}
	var opt = arguments.length === 3 ? arguments[1] : {};
	var cb = arguments.length === 3 ? arguments[2] : arguments[1];
	var es = new ExtractingStream(data, opt);
	var chunks = [];
	es.on('data', function(data) {
		chunks.push(data);
	});
	es.on('end', function() {
		if (typeof(data) === 'string') {
			cb(chunks.join(''));
		} else if (data instanceof Buffer) {
			cb(new Buffer(chunks.join(''), opt.encoding));
		} else {
			cb(null);
		}
	});
}

var graphextract = function(opt) {
	opt = opt || {};
	return through.obj(function(file, enc, cb) {
		var that = this;
		if (file.isNull()) {
			// pass
			that.push(file);
			cb();
		} else if (file.isBuffer()) {
			// extract asynchronously
			extract(file.contents, function(result) {
				file.contents = result;
				that.push(file);
				cb();
			});
		} else if (file.isStream()) {
			// create extracting stream
			file.contents = new ExtractingStream(file.contents, opt);
			that.push(file);
			cb();
		}
	});
};

graphextract.ExtractingStream = ExtractingStream;
graphextract.extract = extract;
module.exports = graphextract;
