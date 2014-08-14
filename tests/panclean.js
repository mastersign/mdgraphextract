var test = require('tape').test;

var panclean = require('../src/panclean');

test('panclean: removeFormat()', function(t) {
	t.equals(panclean.removeFormat(
		'*Abc* **abc** abc *abc*'), 
		'Abc abc abc abc', 
		'remove * emphasis');
	t.equals(panclean.removeFormat(
		'__Abc___abc_ _abc_ abc'), 
		'Abcabc abc abc', 
		'remove _ emphasis');
	t.equals(panclean.removeFormat(
		'`Abc` `abc` `abc`'), 
		'Abc abc abc', 
		'remove `code` format');
	t.equals(panclean.removeFormat(
		'ABC {#abc a=b}'), 
		'ABC', 
		'remove headline attributes');
	t.equals(panclean.removeFormat(
		'ABC<> test<, <http://127.0.0.1/>, < >'), 
		'ABC<> test<, http://127.0.0.1/, < >',
		'remove URL');
	t.equals(panclean.removeFormat(
		'ABC[](#test) test, [link](http://www....), [ok]()'), 
		'ABC test, link, ok',
		'remove URL link');
	t.equals(panclean.removeFormat(
		'ABC[][TEST] test [], [link][head line], [Headline][]'), 
		'ABC test [], link, Headline',
		'remove internal link');
	t.equals(panclean.removeFormat(
		'ABC[] test [Headline], [OK]'), 
		'ABC[] test Headline, OK',
		'remove implicit internal link');
	t.end();
});

test('panclean: getAttributes()', function(t) {
	t.deepEquals(panclean.getAttributes(
		'Headline'),
		{}, 
		'no attributes');
	t.deepEquals(panclean.getAttributes(
		'Headline { }'),
		{}, 
		'empty attributes');
	t.deepEquals(panclean.getAttributes(
		'Headline { #abc }'),
		{ id: 'abc' }, 
		'id only');
	t.deepEquals(panclean.getAttributes(
		'Headline {.class1 .class2}'),
		{ classes: ['class1', 'class2'] }, 
		'classes');
	t.deepEquals(panclean.getAttributes(
		'Headline {key1=value1 key2="value 2"}'),
		{ key1: 'value1', key2: 'value 2' }, 
		'key-value-pairs');
	t.deepEquals(panclean.getAttributes(
		'Headline { key1=value1 .class1  #abc key2="value 2" .class2 }'),
		{ id: 'abc', classes: ['class1', 'class2'], key1: 'value1', key2: 'value 2' }, 
		'mix');
	t.end();
});

test('panclean: anchor() remove leading non letters', function(t) {
	t.equals(panclean.anchor(
		'  headline'),
		'headline',
		'leading whitespace');
	t.equals(panclean.anchor(
		'123 headline'),
		'headline',
		'leading numbers');
	t.equals(panclean.anchor(
		'(1.2): - headline'),
		'headline',
		'arbitrary non letters');
	t.end();
});

test('panclean: anchor() clean characters', function(t) {
	t.equals(panclean.anchor(
		'head-:line_|1|#+~*(23).'),
		'head-line_123.',
		'remove punctuation');
	t.equals(panclean.anchor(
		'head li\tne'),
		'head-li-ne',
		'white spaces');
	t.equals(panclean.anchor(
		'The First HEADLINE'),
		'the-first-headline',
		'lowercase');
	t.end();
});

test('panclean: anchor() empty', function(t) {
	t.equals(panclean.anchor(
		''),
		'section',
		'empty string');
	t.equals(panclean.anchor(
		' \t '),
		'section',
		'white spaces with nothing else');
	t.equals(panclean.anchor(
		'123 + (20)'),
		'section',
		'special chars with white spaces');
	t.end();
});

test('panclean: anchor() attribute id', function(t) {
	t.equals(panclean.anchor(
		'Headline {#abc} '),
		'abc',
		'id in headline attributes');
	t.end();
});
