var through = require('through2');
var Readable = require('stream').Readable;
var util = require('util');
var path = require('path');

var MdParser = require('./mdparser');

var autograph = function(es) {
	var node = null;

	es.push('digraph G {\n');

	es._parser.on('headline', function(e) {
		node = e.text;
		es.push('\t"' + node + '";\n');
	});
	es._parser.on('internal-link', function(e) {
		if (node) {
			es.push('\t"' + node + '" -> "' + e.targetText + '";\n');
		}
	});
	es._parser.on('end', function() {
		es.push('}\n');
		es.push(null);
	})
};

var parseAttributes = function(text) {
	var attributePattern = /(\w+)=(?:(?:\"([^\"]*)\")|(?:(\S+)))/g;
	var m;
	var result = {};
	text = text ? text.trim() : '';
	if (text === '') return result;
	while((m = attributePattern.exec(text)) !== null) {
		result[m[1]] = m[2] || m[3];
	};
	return result;
};

var formatAttribute = function(key, value) {
	return /\s/.test(value)
		? key + '="' + value + '"' 
		: key + '=' + value;
};

/**
 * formatAttributes(attribs1, attribs2, ...)
 */
var formatAttributes = function() {
	var m = {}
	var i;
	var attributes;
	var keys = [];
	for (i = 0; i < arguments.length; i++) {
		attributes = arguments[i];
		if (attributes) {
			for (key in attributes) {
				m[key] = attributes[key];
			}
		}
	}
	for (key in m) {
		keys.push(key);
	}
	return keys.
		sort().
		map(function(key) { return formatAttribute(key, m[key]); }).
		join(' ');
};

var dotex = function(es) {
	var graph = null;
	var lastHeadline = null;

	var cmdPattern = /^\s*@([^\s]+)(?:\s+(.*)\s*)?$/;
	var attributesPattern = /^\s*\w+=(?:(?:\"[^\"]*\")|(?:\S+))/;
	var namePattern = /^(?:([^:<=]*?)\s*)?(?::\s*(.*)\s*)?$/;
	var nameTypePattern = /^(?:([^:<=]*?)\s*)?(?:<([^>]+)>\s*)?(?::\s*(.*)\s*)?$/;
	var edgePattern = /^(?:(.*?)\s*)?->\s*([^:<=]*?)\s*(?:<([^>]+)>\s*)?(?::\s*(.*)\s*)?$/;

	var m;
	var src, cmd, cmdText;
	var attributes, typeAttributes, attributesString;
	var typeName;
	var nodeName, nodeName2, url;

	var nodeBaseAttributes = [];
	var edgeBaseAttributes = [];
	var nodeTypes = {};
	var edgeTypes = {};

	var cache = [];

	var push = function(content) {
		var i;
		if (graph) {
			if (cache.length > 0) { 
				flushCache();
			}
			es.push('\t' + content + ';\n');
		} else {
			cache.push(content);
		}
	};

	var flushCache = function() {
		if (graph === null) return;
		for (i = 0; i < cache.length; i++) {
			es.push('\t' + cache[i] + ';\n');
		}
		cache = [];
	}

	es._parser.on('headline', function(e) {
		lastHeadline = e;
	});
	es._parser.on('comment', function(e) {
		src = e.text.trim();
		m = cmdPattern.exec(src);
		if (!m) { return; }

		cmd = m[1];
		cmdText = m[2] || '';
		switch(cmd) {
		case 'g':
		case 'graph':
			// @graph key=value1 key="value 2"
			m = attributesPattern.exec(cmdText);
			if (m) {
				es.push('digraph G {\n');
				graph = 'G';
				attributes = parseAttributes(cmdText);
				for (key in attributes) { 
					push(formatAttribute(key, attributes[key]));
				}
				return;
			}
			// @graph Graph Name
			// @graph Graph Name: key=value1 key2="value 2"
			m = namePattern.exec(cmdText);
			if (m) {
				es.push('digraph "' + m[1] + '" {\n');
				graph = m[1];
				if (m[2]) {
					attributes = parseAttributes(cmdText);
					for (key in attributes) { 
						push(formatAttribute(key, attributes[key]));
					}
				}
			}
			break;
		case 'na':
		case 'node-attributes':
			// @node-attributes key=value1 key2="value 2"
				attributes = parseAttributes(cmdText);
				for (key in attributes) {
					nodeBaseAttributes[key] = attributes[key];
				}
			break;
		case 'ea':
		case 'edge-attributes':
			// @edge-attributes key=value1 key2="value 2"
				attributes = parseAttributes(cmdText);
				for (key in attributes) {
					edgeBaseAttributes[key] = attributes[key];
				}
			break;
		case 'nt':
		case 'node-type':
			// @node-type Type Name: key=value1 key2="value 2"
			m = namePattern.exec(cmdText);
			if (m) {
				typeName = m[1];
				if (m[2]) {
					if (nodeTypes[typeName] === undefined) {
						nodeTypes[typeName] = {};
					}
					attributes = parseAttributes(m[2]);
					for (key in attributes) { 
						nodeTypes[typeName][key] = attributes[key];
					}
				}
			}
			break;
		case 'et':
		case 'edge-type':
			// @edge-type Type Name: key=value1 key2="value 2"
			m = namePattern.exec(cmdText);
			if (m) {
				typeName = m[1];
				if (m[2]) {
					if (edgeTypes[typeName] === undefined) {
						edgeTypes[typeName] = {};
					}
					attributes = parseAttributes(m[2]);
					for (key in attributes) {
						edgeTypes[typeName][key] = attributes[key];
					}
				}
			}
			break;
		case 'n':
		case 'node':
			// @node key=value1 key2="value 2"
			m = attributesPattern.exec(cmdText);
			if (m) {
				if (!lastHeadline) {
					console.error('No node name given in:\n\t' + src);
					return;
				}
				nodeName = lastHeadline.text;
				attributes = parseAttributes(cmdText);
				if (lastHeadline && nodeName === lastHeadline.text) {
					attributes['url'] = attributes['url'] || ('#' + lastHeadline.anchor);
				}
				attributesString = formatAttributes(
					nodeBaseAttributes, attributes);
				push('"' + nodeName + '"' + 
					(attributesString 
						? ' [' + attributesString + ']'
						: ''));
				return;
			}
			// @node
			// @node Node Name
			// @node <Type Name>
			// @node Node Name <Type Name>
			// @node Node Name: key=value1 key2="value 2"
			// @node <Type Name>: key=value1 key2="value 2"
			// @node Node Name <Type Name>: key=value1 key2="value 2"
			m = nameTypePattern.exec(cmdText);
			if (m) {
				if (!m[1] && !lastHeadline) {
					console.error('No node name given in:\n\t' + src);
					return;
				}
				nodeName = m[1] || lastHeadline.text;
				typeAttributes = nodeTypes[m[2]]
				attributes = parseAttributes(m[3]);
				if (lastHeadline && nodeName === lastHeadline.text) {
					attributes['url'] = attributes['url'] || ('#' + lastHeadline.anchor);
				}
				attributesString = formatAttributes(
					nodeBaseAttributes, typeAttributes, attributes);
				push('"' + nodeName + '"' + 
					(attributesString 
						? ' [' + attributesString + ']'
						: ''));
			}
			break;
		case 'e':
		case 'edge':
			// @edge -> Node Name
			// @edge Node Name -> Node Name
			// @egde [Node Name] -> Node Name <Type Name>
			// @edge [Node Name] -> Node Name: key=value1 key2="value 2"
			// @edge [Node Name] -> Node Name <Type Name>: key=value1 key2="value 2"
			m = edgePattern.exec(cmdText);
			if (m) {
				if (!m[1] && !lastHeadline) {
					console.error('No source node name given in:\n\t' + src);
					return;
				}
				nodeName = m[1] || lastHeadline.text;
				nodeName2 = m[2];
				typeAttributes = edgeTypes[m[3]]
				attributes = parseAttributes(m[4]);
				attributesString = formatAttributes(
					edgeBaseAttributes, typeAttributes, attributes);
				push('"' + nodeName + '" -> "' + nodeName2 + '"' + 
					(attributesString 
						? ' [' + attributesString + ']'
						: ''));
			}
			break;
		}
	});
	es._parser.on('end', function() {
		if (graph === null) {
			es.push('digraph G {\n');
			graph = 'G';
			flushCache();
		}
		es.push('}\n');
		es.push(null);
	});
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
	} else if (opt.mode === 'dotex') {
		dotex(that);
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

var changeFilenameExtension = function(filename, newExt) {
	return filename.slice(0, -path.extname(filename).length) + newExt;
};

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
			extract(file.contents, opt, function(result) {
				file.contents = result;
				file.path = changeFilenameExtension(file.path, '.gv');
				that.push(file);
				cb();
			});
		} else if (file.isStream()) {
			// create extracting stream
			file.contents = new ExtractingStream(file.contents, opt);
			file.path = changeFilenameExtension(file.path, '.gv');
			that.push(file);
			cb();
		}
	});
};

graphextract.ExtractingStream = ExtractingStream;
graphextract.extract = extract;
module.exports = graphextract;
