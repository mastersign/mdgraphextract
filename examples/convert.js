var fs = require('fs');
var mdge = require('../src/index');
var path = require('path');
var spawn = require('child_process').spawn;

var changeExt = function(filename, newExt) {
	return filename.slice(0,-path.extname(filename).length) + newExt;
};

var sourcePath = process.argv[2];
var dotPath = changeExt(sourcePath, '.gv');
var imagePath = changeExt(sourcePath, '.png');

var mode = process.argv[3];
var childProc;

fs.readFile(sourcePath, function(err, source) {
	if (err) { throw err; }
	mdge.extract(source, { mode: mode }, function(result) {
		fs.writeFile(dotPath, result, function(err) {
			if (err) { throw err; }
			childProc = spawn('dot', [
				'-Tpng',
				'-Nfontname=Helvetica',
				'-o', imagePath,
				dotPath],
				{ stdio: 'inherit' });
		});
	});
});
