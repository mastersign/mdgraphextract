var path = require('path');
var exec = require('child_process').exec;
var glob = require('glob');

var switches = [
	'pipe_tables',
	'table_captions',
	'pandoc_title_block',
	'yaml_metadata_block',
	'lists_without_preceding_blankline',
	'abbreviations',
	'tex_math_dollars',
	'auto_identifiers',
	'implicit_header_references',
	'definition_lists'
];

var args = [
	'-r', 'markdown+' + switches.join('+'),
	'--normalize',
	'--smart',
	'-w html5',
	'--standalone',
	'-o'
];

glob('*.md', function(err, files) {
	files.forEach(function(f) {
		var target = path.join(path.dirname(f), path.basename(f, '.md') + '.html');
		var myArgs = args.concat(['"' + target + '"', '"' + f + '"']);
		exec('pandoc ' + myArgs.join(' '));
	});
});
