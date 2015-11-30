/* globals require, Buffer, describe, it */

var assert = require('assert');
var streamifier = require('streamifier');

var lines = require('../src/lines');

describe('lines', function () {

	it('from null', function(done) {
		assert.equal(lines(null), undefined);
		done();
	});

	it('from undefined', function(done) {
		assert.equal(lines(), undefined);
		done();
	});

	it('from string (flow)', function(done) {
		var text = 'Hallo Welt\r\n Was geht? \n\nUnd tschüß.';
		var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.'];

		var result = [];
		var s = lines(text);
		s.on('data', function(line) {
			result.push(line);
		});
		s.on('end', function() {
			assert.deepEqual(result, expects);
			done();
		});
	});

	it('from string (non-flow)', function(done) {
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
			assert.deepEqual(result, expects);
			done();
		});
	});

	it('from buffer (flow)', function(done) {
		var buffer = new Buffer('Hallo Welt\r\n Was geht? \n\nUnd tschüß.\n', 'utf8');
		var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.', ''];

		var result = [];
		var s = lines(buffer, 'utf8');
		s.on('data', function(line) {
			result.push(line);
		});
		s.on('end', function() {
			assert.deepEqual(result, expects);
			done();
		});
	});

	it('from buffer (non-flow)', function(done) {
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
			assert.deepEqual(result, expects);
			done();
		});
	});

	it('from stream (flow)', function(done) {
		var stream = streamifier.createReadStream('Hallo Welt\r\n Was geht? \n\nUnd tschüß.\n', { encoding: 'utf8' });
		var expects = ['Hallo Welt', ' Was geht? ', '', 'Und tschüß.', ''];

		var result = [];
		var s = lines(stream);
		s.on('data', function(line) {
			result.push(line);
		});
		s.on('end', function() {
			assert.deepEqual(result, expects);
			done();
		});
	});

	it('from stream (non-flow)', function(done) {
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
			assert.deepEqual(result, expects);
			done();
		});
	});

});