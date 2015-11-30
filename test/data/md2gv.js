var path = require('path');
var glob = require('glob');
var fs = require('fs');
var graphextract = require('../../src/index');

var transform = function(f, opt) {
	var target = path.join(path.dirname(f), path.basename(f, '.md') + '.gv');
	var es = new graphextract.ExtractingStream(fs.createReadStream(f), opt);
	es.pipe(fs.createWriteStream(target));
};

var tasks = [
	{ 
		file: 'doc_dotex.md',
		opt: { mode: 'dotex' }
	},
	{ 
		file: 'doc_autograph.md',
		opt: { }
	}	
];

for (var i = 0; i < tasks.length; i++) {
	var task = tasks[i];
	transform(task.file, task.opt);
};