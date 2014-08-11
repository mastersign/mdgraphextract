var test = require('tap').test;
var streamifier = require('streamifier');

var lines = require('../lines');

test('Lines from null', function(t) {
	t.equals(lines(null), undefined);
	t.end();
});

test('Lines from undefined', function(t) {
	t.equals(lines(), undefined);
	t.end();
});

test('Lines from string', function(t) {
	var text = 'Hallo Welt\r\n Was geht? \n\nUnd tschüß.';
	var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.'];

	var result = [];
	var s = lines(text);
	s.on('data', function(line) { 
		result.push(line); 
	});
	s.on('end', function() {
		t.deepEqual(result, expects);
		t.end();
	});
});

test('Lines from buffer', function(t) {
	var buffer = new Buffer('Hallo Welt\r\n Was geht? \n\nUnd tschüß.\n', 'utf-8');
	var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.', ''];

	var result = [];
	var s = lines(buffer);
	s.on('data', function(line) { 
		result.push(line); 
	});
	s.on('end', function() {
		t.deepEqual(result, expects);
		t.end();
	});
});

test('Lines from stream', function(t) {
	var stream = streamifier.createReadStream('Hallo Welt\r\n Was geht? \n\nUnd tschüß.\n', { encoding: 'utf-8' });
	var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.', ''];

	var result = [];
	var s = lines(stream);
	s.on('data', function(line) { 
		result.push(line); 
	});
	s.on('end', function() {
		t.deepEqual(result, expects);
		t.end();
	});
});
