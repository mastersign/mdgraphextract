var removeFormat = function(title) {
	title = title.replace(/(\*\*?)(.*?)\1/g, '$2');
	title = title.replace(/(__?)(.*?)\1/g, '$2');
	title = title.replace(/`(.*?)`/g, '$1');
	title = title.replace(/\s*\{[^\}]*\}$/g, '');
	title = title.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1');
	title = title.replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1');
	title = title.replace(/\[([^\]]+)\]/g, '$1');
	title = title.replace(/<([^\s>]+)>/g, '$1');
	return title;
};
module.exports.removeFormat = removeFormat;

var anchor = function(title, cache) {
	title = removeFormat(title);
	title = title.replace(/^[\W\d]*/, '');
	title = title.trim();
	title = title.replace(/\s/g, '-');
	title = title.replace(/[^\w_\-\.]/g, '');
	title = title.toLowerCase();
	if (title === '') {	title = 'section'; }
	return title;
};
module.exports.anchor = anchor;


/*
Remove all formatting, links, etc.
Remove all footnotes.
Remove all punctuation, except underscores, hyphens, and periods.
Replace all spaces and newlines with hyphens.
Convert all alphabetic characters to lowercase.
Remove everything up to the first letter (identifiers may not begin with a number or punctuation mark).
If nothing is left after this, use the identifier 'section'.
*/