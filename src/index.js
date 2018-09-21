/* global Buffer */
var through = require('through2');
var Readable = require('stream').Readable;
var util = require('util');
var path = require('path');
var _ = require('lodash');

var MdParser = require('./mdparser');

var includes = function (haystack, needle) {
	return _.some(haystack, function (e) {
		return e == needle;
	});
};

var autograph = function (es, opt) {
	var node = null;
	var label = null;
	var level = opt.autographLevel;
	var strictLevel = !!opt.autographLevelStrict;
	var refPrefix = opt.refPrefix || '';
	var noAutoRefs = !!opt.noAutoRefs;
	var isolated = !!opt.autographIsolatedNodes;
	var implicit = !!opt.autographImplicitNodes;

	var references = [];
	var nodes = [];
	var edges = [];

	es._parser.on('headline', function (e) {
		var skip = false;
		if (level) {
			if (typeof(level) === 'number') {
				if (level !== e.level) { skip = true; }
			} else if (!_.includes(level, e.level)) {
				return;
			}
		}
		node = e.text;
		label = null;
		var attributes = [];
		if (opt.levelFormat) {
			if (e.level === 1) {
				label = '<B>' + node + '</B>';
			} else if (e.level === 2) {
				label = '<I>' + node + '</I>';
			}
			if (label) {
				attributes.push('label=<' + label + '>');
			}
		}
		if (!noAutoRefs) {
			var urlAttribute = 'URL="';
			if (refPrefix) {
				urlAttribute += refPrefix;
			}
			urlAttribute += '#' + e.anchor + '"';
			attributes.push(urlAttribute);
		}
		var attributeStr = '';
		if (attributes.length > 0) {
			attributeStr = ' [' + attributes.join(', ') + ']';
		}
		nodes.push({
			label: node,
			skip: skip,
			dot: '\t"' + node + '"' + attributeStr + ';\n'
		 });
	});
	es._parser.on('internal-link', function (e) {
		if (node) {
			edges.push({
				from: node,
				to: e.targetText,
				dot: '\t"' + node + '" -> "' + e.targetText + '";\n'
			});
		}
	});
	es._parser.on('reference', function (e) {
		references.push(e.label);
	});
	es._parser.on('end', function () {
		var definedNodeLabels = _(nodes)
			.map(function (n) { return n.label; })
			.value();
		var levelNodeLabels = _(nodes)
			.filter(function (n) { return !n.skip; })
			.map(function (n) { return n.label; })
			.value();
		var selectedEdges = _(edges)
			.filter(function (e) {
				return !includes(references, e.to);
			})
			.filter(function (e) {
				return implicit ||
					!strictLevel && includes(definedNodeLabels, e.to) ||
					includes(levelNodeLabels, e.from) && includes(levelNodeLabels, e.to);
			})
			.value();
		var usedNodeLabels = _(selectedEdges)
				.map(function (e) { return e.from; })
				.concat(_.map(selectedEdges, function (e) { return e.to; }))
				.uniq()
				.value();
		var selectedNodes = _.filter(nodes, function (n) {
				return includes(usedNodeLabels, n.label) ||
					isolated && includes(levelNodeLabels, n.label);
			});
		es.push('digraph G {\n');
		_.forEach(selectedNodes, function (n) {
			es.push(n.dot);
		});
		_.forEach(selectedEdges, function (e) {
	 		es.push(e.dot);
	 	});
		es.push('}\n');
		es.push(null);
	});
};

var parseAttributes = function (text) {
	var attributePattern = /(\w+)=(?:(?:\"([^\"]*)\")|(?:([^\s,]+)))/g;
	var m;
	var result = {};
	text = text ? text.trim() : '';
	if (text === '') return result;
	while((m = attributePattern.exec(text)) !== null) {
		result[m[1]] = m[2] || m[3];
	}
	return result;
};

var formatAttribute = function (key, value) {
	if (value.length > 2 && value[0] === '<' && value[value.length - 1] === '>') {
		return key + '=<' + value + '>';
	}
	if (/\W/.test(value)) {
		return key + '="' + value + '"';
	}
	return key + '=' + value;
};

/**
 * formatAttributes(attribs1, attribs2, ...)
 */
var formatAttributes = function () {
	var m = {};
	var i, key;
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
		sort(function (a, b) {
			a = a.toLowerCase();
			b = b.toLowerCase();
			return ((a == b) ? 0 : ((a > b) ? 1 : -1));
		}).
		map(function (key) { return formatAttribute(key, m[key]); }).
		join(' ');
};

var dotex = function (es, opt) {
	var noAutoRefs = opt.noAutoRefs;
	var refPrefix = opt.refPrefix || '';
	var queryGroups = typeof(opt.group) == 'string' ?
		[ opt.group ] : (opt.group || []);

	var graph = null;
	var lastHeadline = null;

	var cmdPattern = /^\s*@(\S+)(?:((?:\s+#\S+)+))?(?:\s+(.*)\s*)?$/;
	var attributesPattern = /^\s*\w+=(?:(?:\"[^\"]*\")|(?:\S+))/;
	var namePattern = /^(?:([^:<=]*?)\s*)?(?::\s*(.*)\s*)?$/;
	var nameTypePattern = /^(?:([^:<=]*?)\s*)?(?:<([^>]+)>\s*)?(?::\s*(.*)\s*)?$/;
	var edgePattern = /^(?:(.*?)\s*)?(->|<-)\s*([^:<=]*?)\s*(?:<([^>]+)>\s*)?(?::\s*(.*)\s*)?$/;

	var m;
	var src, cmd, cmdTags, cmdText;
	var attributes, typeAttributes, attributesString;
	var typeName;
	var nodeName, nodeName2;

	var nodeTypes = {};
	var edgeTypes = {};

	var cache = [];
	var nodes = [];
	var edges = [];

	var currentTags = [];

	var push = function (content) {
		if (graph) {
			if (cache.length > 0) {
				flushCache();
			}
			es.push('\t' + content + ';\n');
		} else {
			cache.push(content);
		}
	};

	var flushCache = function () {
		var i;
		if (graph === null) return;
		for (i = 0; i < cache.length; i++) {
			es.push('\t' + cache[i] + ';\n');
		}
		cache = [];
	};

	var storeNode = function (name, tags, attrStr) {
		var node = { name: name, tags: tags, attrStr: attrStr};
		nodes.push(node);
	};

	var storeEdge = function (fromName, toName, attrStr) {
		var edge = { from: fromName, to: toName, attrStr: attrStr};
		edges.push(edge);
	};

	var pushNode = function (node) {
		push('"' + node.name + '"' +
			(node.attrStr ?
			 ' [' + node.attrStr + ']' :
			 ''));
	};

	var pushEdge = function (edge) {
		push('"' + edge.from + '" -> "' + edge.to + '"' +
			(edge.attrStr ?
			 ' [' + edge.attrStr + ']' :
			 ''));
	};

	var parseTags = function (tagStr) {
		if (!tagStr) { return []; }
		var tagPattern = /#(\S+)/g;
		var tags = [];
		var result;
		while ((result = tagPattern.exec(tagStr)) !== null) {
			tags.push(result[1]);
		}
		return tags;
	};

	var isIntersectionEmpty = function (a, b) {
		return !_.find(a, function (item) { return _.includes(b, item); });
	};

	var matchTags = function (tags) {
		if (tags.length === 0) {
			return true;
		}
		return !isIntersectionEmpty(queryGroups, tags);
	};

	var isNodeReferencedByAnEdge = function (name) {
		return _.some(edges, function (edge) {
			return edge.from === name || edge.to === name;
		});
	};

	var pushNodesAndEdges = function () {
		_.forEach(nodes, function (node) {
			if (matchTags(node.tags) ||
				isNodeReferencedByAnEdge(node.name)) {

				pushNode(node);
			}
		});
		_.forEach(edges, pushEdge);
	};

	es._parser.on('headline', function (e) {
		lastHeadline = e;
	});
	es._parser.on('endComment', function (e) {
		currentTags = [];
	});
	es._parser.on('comment', function (e) {
		var key;
		src = e.text.trim();
		m = cmdPattern.exec(src);
		if (!m) { return; }

		cmd = m[1];
		if (cmd === 't' || cmd === 'tags') {
			currentTags = parseTags(m[2]);
			return;
		} else {
			cmdTags = currentTags.concat(parseTags(m[2]));
		}

		if (cmd !== 'n' && cmd !== 'node'  &&
			!matchTags(cmdTags)) {
			// nodes are stored, even if the tags do not match,
			// to be available if they are referenced by an edge
			return;
		}

		cmdText = m[3] || '';
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
		case 'ga':
		case 'graph-attributes':
			// @graph-attributes key=value1 key2="value 2"
				attributes = parseAttributes(cmdText);
				attributes = parseAttributes(cmdText);
				for (key in attributes) {
					push(formatAttribute(key, attributes[key]));
				}
			break;
		case 'na':
		case 'node-attributes':
			// @node-attributes key=value1 key2="value 2"
				attributes = parseAttributes(cmdText);
				push('node [' + formatAttributes(attributes) + ']');
			break;
		case 'ea':
		case 'edge-attributes':
			// @edge-attributes key=value1 key2="value 2"
				attributes = parseAttributes(cmdText);
				push('edge [' + formatAttributes(attributes) + ']');
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
				if (!attributes.URL && !noAutoRefs && lastHeadline && nodeName === lastHeadline.text) {
					attributes.URL = refPrefix + '#' + lastHeadline.anchor;
				}
				attributesString = formatAttributes(attributes);
				storeNode(nodeName, cmdTags, attributesString);
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
				typeAttributes = nodeTypes[m[2]];
				attributes = parseAttributes(m[3]);
				if (lastHeadline && nodeName === lastHeadline.text) {
					attributes.URL = attributes.URL || ('#' + lastHeadline.anchor);
				}
				attributesString = formatAttributes(
					typeAttributes, attributes);
				storeNode(nodeName, cmdTags, attributesString);
			}
			break;
		case 'e':
		case 'edge':
			// @edge -> Node Name
			// @edge Node Name -> Node Name
			// @egde [Node Name] -> Node Name <Type Name>
			// @edge [Node Name] -> Node Name: key=value1 key2="value 2"
			// @edge [Node Name] -> Node Name <Type Name>: key=value1 key2="value 2"
			// @edge <- Node Name
			// @edge Node Name <- Node Name
			// @egde [Node Name] <- Node Name <Type Name>
			// @edge [Node Name] <- Node Name: key=value1 key2="value 2"
			// @edge [Node Name] <- Node Name <Type Name>: key=value1 key2="value 2"
			m = edgePattern.exec(cmdText);
			if (m) {
				if (!m[1] && !lastHeadline) {
					console.error('No source node name given in:\n\t' + src);
					return;
				}
				if (m[2] == '->') {
					nodeName = m[1] || lastHeadline.text;
					nodeName2 = m[3];
				} else {
					nodeName2 = m[1] || lastHeadline.text;
					nodeName = m[3];
				}
				typeAttributes = edgeTypes[m[4]];
				attributes = parseAttributes(m[5]);
				attributesString = formatAttributes(
					typeAttributes, attributes);
				storeEdge(nodeName, nodeName2, attributesString);
			}
			break;
		}
	});
	es._parser.on('end', function () {
		if (graph === null) {
			es.push('digraph G {\n');
			graph = 'G';
			flushCache();
		}
		pushNodesAndEdges();
		es.push('}\n');
		es.push(null);
	});
};

var ExtractingStream = function (input, opt) {
	var that = this;
	var readableOpt = {};
	opt = opt || {};

	readableOpt.encoding = opt.encoding;
	readableOpt.objectMode = false;
	Readable.call(this, readableOpt);

	that._parser = new MdParser(input, opt.encoding);

	if ((opt.mode || 'auto') === 'auto') {
		autograph(that, opt);
	} else if (opt.mode === 'dotex') {
		dotex(that, opt);
	} else {
		throw "Unsupported mode.";
	}
};
util.inherits(ExtractingStream, Readable);

ExtractingStream.prototype._read = function () {
	this._parser.resume();
};

/**
 * extract(data, cb)
 * extract(data, opt, cb)
 */
var extract = function (data) {
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
	es.on('data', function (buf) {
		chunks.push(buf);
	});
	es.on('end', function () {
		if (typeof(data) === 'string') {
			cb(chunks.join(''));
		} else if (data instanceof Buffer) {
			cb(new Buffer(chunks.join(''), opt.encoding));
		} else {
			cb(null);
		}
	});
};

var changeFilenameExtension = function (filename, newExt) {
	return filename.slice(0, -path.extname(filename).length) + newExt;
};

var graphextract = function (opt) {
	opt = opt || {};
	return through.obj(function (file, enc, cb) {
		var that = this;
		if (file.isNull()) {
			// pass
			that.push(file);
			cb();
		} else if (file.isBuffer()) {
			// extract asynchronously
			extract(file.contents, opt, function (result) {
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
