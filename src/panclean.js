var cleanHeadline = function(title) {
	title = title.replace(/\*\*(.*?)\*\*/, '$1');
	title = title.replace(/\*(.*?)\*/, '$1');
	title = title.replace(/__(.*?)__/, '$1');
	title = title.replace(/_(.*?)_/, '$1');
	title = title.replace(/`(.*?)`/, '$1');
	title = title.replace(/\s*\{[^\}]*\}$/, '');
	// links [...](...), [][...], [...][...]
	return title;
};
module.exports.cleanHeadline = cleanHeadline;

var anchor = function(title, cache) {
	title = cleanHeadline(title);
	title = title.replace(/^\s*\W+\s*/, '');
	return title.replace(' ', '-');
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