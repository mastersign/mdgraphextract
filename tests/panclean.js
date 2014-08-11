var test = require('tap').test;
var panclean = require('../panclean');

test('Remove string formats', function(t) {
	t.equals(panclean.cleanHeadline('Abc **abc** abc *abc*'), 'Abc abc abc abc');
	t.equals(panclean.cleanHeadline('Abc__abc__ _abc_ abc'), 'Abcabc abc abc');
	t.equals(panclean.cleanHeadline('Abc abc_ `abc`*'), 'Abc abc_ abc*');
	t.equals(panclean.cleanHeadline('ABC {#abc a=b}'), 'ABC');
	t.end();
});