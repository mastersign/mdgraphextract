var test = require('tape').test;
var streamifier = require('streamifier');

var lines = require('../src/lines');

test('Lines from null', function(t) {
	t.equals(lines(null), undefined);
	t.end();
});

test('Lines from undefined', function(t) {
	t.equals(lines(), undefined);
	t.end();
});

test('Lines from string (flow)', function(t) {
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

test('Lines from string (non-flow)', function(t) {
	var text = 'Hallo Welt\r\n Was geht? \n\nUnd tschüß.';
	var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.'];

	var result = [];
	var s = lines(text);
	var doRead = function() { 
		var line = s.read();
		if (line !== null) {
			result.push(line);
			return true;
		} else {
			return false;
		}
	};
	s.on('readable', function() {
		while(doRead());
	});
	s.on('end', function() {
		t.deepEqual(result, expects);
		t.end();
	});
});

test('Lines from buffer (flow)', function(t) {
	var buffer = new Buffer('Hallo Welt\r\n Was geht? \n\nUnd tschüß.\n', 'utf8');
	var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.', ''];

	var result = [];
	var s = lines(buffer, 'utf8');
	s.on('data', function(line) { 
		result.push(line); 
	});
	s.on('end', function() {
		t.deepEqual(result, expects);
		t.end();
	});
});

test('Lines from buffer (non-flow)', function(t) {
	var buffer = new Buffer('Hallo Welt\r\n Was geht? \n\nUnd tschüß.\n', 'utf8');
	var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.', ''];

	var result = [];
	var s = lines(buffer);
	var doRead = function() { 
		var line = s.read();
		if (line !== null) {
			result.push(line);
			return true;
		} else {
			return false;
		}
	};
	s.on('readable', function() {
		while(doRead());
	});
	s.on('end', function() {
		t.deepEqual(result, expects);
		t.end();
	});
});

test('Lines from stream (flow)', function(t) {
	var stream = streamifier.createReadStream('Hallo Welt\r\n Was geht? \n\nUnd tschüß.\n', { encoding: 'utf8' });
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

test('Lines from stream (non-flow)', function(t) {
	var stream = streamifier.createReadStream('Hallo Welt\r\n Was geht? \n\nUnd tschüß.\n', { encoding: 'utf8' });
	var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.', ''];

	var result = [];
	var s = lines(stream);
	var doRead = function() { 
		var line = s.read();
		if (line !== null) {
			result.push(line);
			return true;
		} else {
			return false;
		}
	};
	s.on('readable', function() {
		while(doRead());
	});
	s.on('end', function() {
		t.deepEqual(result, expects);
		t.end();
	});
});
