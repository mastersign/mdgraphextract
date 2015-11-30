/* globals require, describe, it */

var assert = require('assert');

var panclean = require('../src/panclean');

describe('panclean', function () {

	it('removeFormat()', function(done) {
		assert.equal(panclean.removeFormat(
			'*Abc* **abc** abc *abc*'),
			'Abc abc abc abc',
			'remove * emphasis');
		assert.equal(panclean.removeFormat(
			'__Abc___abc_ _abc_ abc'),
			'Abcabc abc abc',
			'remove _ emphasis');
		assert.equal(panclean.removeFormat(
			'`Abc` `abc` `abc`'),
			'Abc abc abc',
			'remove `code` format');
		assert.equal(panclean.removeFormat(
			'ABC {#abc a=b}'),
			'ABC',
			'remove headline attributes');
		assert.equal(panclean.removeFormat(
			'ABC<> test<, <http://127.0.0.1/>, < >'),
			'ABC<> test<, http://127.0.0.1/, < >',
			'remove URL');
		assert.equal(panclean.removeFormat(
			'ABC[](#test) test, [link](http://www....), [ok]()'),
			'ABC test, link, ok',
			'remove URL link');
		assert.equal(panclean.removeFormat(
			'ABC[][TEST] test [], [link][head line], [Headline][]'),
			'ABC test [], link, Headline',
			'remove internal link');
		assert.equal(panclean.removeFormat(
			'ABC[] test [Headline], [OK]'),
			'ABC[] test Headline, OK',
			'remove implicit internal link');
		done();
	});

	it('getAttributes()', function(done) {
		assert.deepEqual(panclean.getAttributes(
			'Headline'),
			{},
			'no attributes');
		assert.deepEqual(panclean.getAttributes(
			'Headline { }'),
			{},
			'empty attributes');
		assert.deepEqual(panclean.getAttributes(
			'Headline { #abc }'),
			{ id: 'abc' },
			'id only');
		assert.deepEqual(panclean.getAttributes(
			'Headline {.class1 .class2}'),
			{ classes: ['class1', 'class2'] },
			'classes');
		assert.deepEqual(panclean.getAttributes(
			'Headline {key1=value1 key2="value 2"}'),
			{ key1: 'value1', key2: 'value 2' },
			'key-value-pairs');
		assert.deepEqual(panclean.getAttributes(
			'Headline { key1=value1 .class1  #abc key2="value 2" .class2 }'),
			{ id: 'abc', classes: ['class1', 'class2'], key1: 'value1', key2: 'value 2' },
			'mix');
		done();
	});

	it('anchor() remove leading non letters', function(done) {
		assert.equal(panclean.anchor(
			'  headline'),
			'headline',
			'leading whitespace');
		assert.equal(panclean.anchor(
			'123 headline'),
			'headline',
			'leading numbers');
		assert.equal(panclean.anchor(
			'(1.2): - headline'),
			'headline',
			'arbitrary non letters');
		done();
	});

	it('anchor() clean characters', function(done) {
		assert.equal(panclean.anchor(
			'head-:line.|1|#+~*$§(23)@€.'),
			'head-line.123.',
			'remove punctuation');
		assert.equal(panclean.anchor(
			'head-line_äöüÄÖÜßÂÅî'),
			'head-line_äöüäöüßâåî',
			'keep foreign language letters');
		assert.equal(panclean.anchor(
			'head li\tne'),
			'head-li-ne',
			'white spaces');
		assert.equal(panclean.anchor(
			'The First HEADLINE'),
			'the-first-headline',
			'lowercase');
		done();
	});

	it('anchor() empty', function(done) {
		assert.equal(panclean.anchor(
			''),
			'section',
			'empty string');
		assert.equal(panclean.anchor(
			' \t '),
			'section',
			'white spaces with nothing else');
		assert.equal(panclean.anchor(
			'123 + (20)'),
			'section',
			'special chars with white spaces');
		done();
	});

	it('anchor() attribute id', function(done) {
		assert.equal(panclean.anchor(
			'Headline {#abc} '),
			'abc',
			'id in headline attributes');
		done();
	});

});