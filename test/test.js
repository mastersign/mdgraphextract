/* globals require, describe, it */

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var File = require('vinyl');

var graphextract = require('../src/index');

function test() {}

describe('mdgraphextract', function() {

    var autographExampleFile = 'test/data/doc_autograph.md';
    var dotexExampleFile = 'test/data/doc_dotex.md';
    var multiDotexExampleFile = 'test/data/doc_multi_dotex.md';
    var multiDotexExampleFile2 = 'test/data/doc_multi_dotex_2.md';
    var yamlHeaderExampleFile = 'test/data/yaml-header.md';

    var autographResult =
        'digraph G {\n' +
        '\t"hädline" [label="1 Hädline"];\n' +
        '\t"h2" [label="2 Headline"];\n' +
        '\t"subßection-a" [label="Subßection A"];\n' +
        '\t"subsection-b" [label="Subsection B"];\n' +
        '\t"hädline" -> "subßection-a";\n' +
        '\t"hädline" -> "subsection-b";\n' +
        '\t"subßection-a" -> "h2";\n' +
        '\t"subßection-a" -> "h2";\n' +
        '\t"subsection-b" -> "hädline";\n' +
        '\t"subsection-b" -> "subßection-a";\n' +
        '}\n';

    var yamlHeaderResult =
        'digraph G {\n' +
        '\t"headline-1" [label="Headline 1"];\n' +
        '\t"headline-2" [label="Headline 2"];\n' +
        '\t"headline-1" -> "headline-2";\n' +
        '\t"headline-2" -> "headline-1";\n' +
        '}\n';

    describe('ExtractingStream', function () {

        describe('text: autograph mode', function () {

            it('should extract the expected graph data', function (done) {
                var s = new graphextract.ExtractingStream(
                    fs.createReadStream(autographExampleFile, 'utf8'),
                    { noAutoRefs: true });

                var expected = autographResult;
                var result = '';

                s.on('end', function() {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
                s.on('data', function(data) {
                    result = result + data;
                });
            });

        });

        describe('binary: autograph mode', function () {

            it('should extract the expected graph data', function (done) {
                var s = new graphextract.ExtractingStream(
                    fs.createReadStream(autographExampleFile),
                    { noAutoRefs: true });

                var expected = autographResult;
                var result = '';

                s.on('end', function() {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
                s.on('data', function(data) {
                    result = result + data;
                });
            });

        });

    });

    describe('extract()', function () {

        describe('with string', function () {

            it('autograph mode', function (done) {
                var text = fs.readFileSync(autographExampleFile, 'utf8');
                var expected = autographResult;
                graphextract.extract(text, { noAutoRefs: true }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('autograph mode, with auto refs', function (done) {
                var text = fs.readFileSync(autographExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"hädline" [label="1 Hädline", URL="#hädline"];\n' +
                    '\t"h2" [label="2 Headline", URL="#h2"];\n' +
                    '\t"subßection-a" [label="Subßection A", URL="#subßection-a"];\n' +
                    '\t"subsection-b" [label="Subsection B", URL="#subsection-b"];\n' +
                    '\t"hädline" -> "subßection-a";\n' +
                    '\t"hädline" -> "subsection-b";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subsection-b" -> "hädline";\n' +
                    '\t"subsection-b" -> "subßection-a";\n' +
                    '}\n';
                graphextract.extract(text, { }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('autograph mode, with prefix', function (done) {
                var text = fs.readFileSync(autographExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"hädline" [label="1 Hädline", URL="target.html#hädline"];\n' +
                    '\t"h2" [label="2 Headline", URL="target.html#h2"];\n' +
                    '\t"subßection-a" [label="Subßection A", URL="target.html#subßection-a"];\n' +
                    '\t"subsection-b" [label="Subsection B", URL="target.html#subsection-b"];\n' +
                    '\t"hädline" -> "subßection-a";\n' +
                    '\t"hädline" -> "subsection-b";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subsection-b" -> "hädline";\n' +
                    '\t"subsection-b" -> "subßection-a";\n' +
                    '}\n';
                graphextract.extract(text, { refPrefix: 'target.html' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('autograph mode, with isolated', function (done) {
                var text = fs.readFileSync(autographExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"hädline" [label="1 Hädline"];\n' +
                    '\t"h2" [label="2 Headline"];\n' +
                    '\t"subßection-a" [label="Subßection A"];\n' +
                    '\t"subsection-b" [label="Subsection B"];\n' +
                    '\t"isolated" [label="3 Isolated"];\n' +
                    '\t"hädline" -> "subßection-a";\n' +
                    '\t"hädline" -> "subsection-b";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subsection-b" -> "hädline";\n' +
                    '\t"subsection-b" -> "subßection-a";\n' +
                    '}\n';
                graphextract.extract(text, { noAutoRefs: true, autographIsolatedNodes: true }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('autograph mode, with implicit', function (done) {
                var text = fs.readFileSync(autographExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"hädline" [label="1 Hädline"];\n' +
                    '\t"h2" [label="2 Headline"];\n' +
                    '\t"subßection-a" [label="Subßection A"];\n' +
                    '\t"subsection-b" [label="Subsection B"];\n' +
                    '\t"hädline" -> "subßection-a";\n' +
                    '\t"hädline" -> "subsection-b";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subsection-b" -> "hädline";\n' +
                    '\t"subsection-b" -> "subßection-a";\n' +
                    '\t"subsection-b" -> "nowhere";\n' +
                    '}\n';
                graphextract.extract(text, { noAutoRefs: true, autographImplicitNodes: true }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('autograph mode, level = 2', function (done) {
                var text = fs.readFileSync(autographExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"hädline" [label="1 Hädline"];\n' +
                    '\t"h2" [label="2 Headline"];\n' +
                    '\t"subßection-a" [label="Subßection A"];\n' +
                    '\t"subsection-b" [label="Subsection B"];\n' +
                    '\t"hädline" -> "subßection-a";\n' +
                    '\t"hädline" -> "subsection-b";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subßection-a" -> "h2";\n' +
                    '\t"subsection-b" -> "hädline";\n' +
                    '\t"subsection-b" -> "subßection-a";\n' +
                    '}\n';
                graphextract.extract(text, { noAutoRefs: true, autographLevel: 2 }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('autograph mode, level = 2 strict', function (done) {
                var text = fs.readFileSync(autographExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"subßection-a" [label="Subßection A"];\n' +
                    '\t"subsection-b" [label="Subsection B"];\n' +
                    '\t"subsection-b" -> "subßection-a";\n' +
                    '}\n';
                graphextract.extract(text, { noAutoRefs: true, autographLevel: 2, autographLevelStrict: true }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('autograph mode, with multi-edge grouping', function (done) {
                var text = fs.readFileSync(autographExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"hädline" [label="1 Hädline"];\n' +
                    '\t"h2" [label="2 Headline"];\n' +
                    '\t"subßection-a" [label="Subßection A"];\n' +
                    '\t"subsection-b" [label="Subsection B"];\n' +
                    '\t"hädline" -> "subßection-a";\n' +
                    '\t"hädline" -> "subsection-b";\n' +
                    '\t"subßection-a" -> "h2" [weight=2];\n' +
                    '\t"subsection-b" -> "hädline";\n' +
                    '\t"subsection-b" -> "subßection-a";\n' +
                    '}\n';
                graphextract.extract(text, { noAutoRefs: true, groupMultiEdges: true }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });


            it('autograph mode with YAML header', function (done) {
               var text = fs.readFileSync(yamlHeaderExampleFile, 'utf8');
               var expected = yamlHeaderResult;
               graphextract.extract(text, { noAutoRefs: true }, function (result) {
                   assert.equal(result, expected, 'dot output does not equal expectation');
                   done();
               });
            });

            it('dotex mode, empty named graph', function (done) {
                var text = '<!-- @g Graph -->';
                var expected =
                    'digraph "Graph" {\n' +
                    '}\n';

                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, graph attributes', function(done) {
                var text = '<!-- @g size="1, 1" -->';
                var expected =
                    'digraph G {\n' +
                    '\tsize="1, 1";\n' +
                    '}\n';

                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, named graph with attributes', function(done) {
                var text = '<!-- @g Graph: size="1, 1" fontname=Helvetica -->';
                var expected =
                    'digraph "Graph" {\n' +
                    '\tsize="1, 1";\n' +
                    '\tfontname=Helvetica;\n' +
                    '}\n';

                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, node attributes', function(done) {
                var text =
                    '<!-- @na fillcolor="#000000" color="#FF0000" -->' +
                    '<!-- @nt type1: color="#FFFFFF" -->' +
                    '<!-- @n abc <type1>: style=box -->';
                var expected =
                    'digraph G {\n' +
                    '\tnode [color="#FF0000" fillcolor="#000000"];\n' +
                    '\t"abc" [color="#FFFFFF" style=box];\n' +
                    '}\n';

                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, context node', function(done) {
                var text =
                    '# H1\n' +
                    '<!-- @node -->';
                var expected =
                    'digraph G {\n' +
                    '\t"H1" [URL="#h1"];\n' +
                    '}\n';

                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });


            it('dotex mode, edge attributes', function(done) {
                var text =
                    '<!-- @ea color="#FF0000" style=dashed -->' +
                    '<!-- @et type1: color="#FFFFFF" -->' +
                    '<!-- @e A -> B <type1>: arrowhead="vee" -->';
                var expected =
                    'digraph G {\n' +
                    '\tedge [color="#FF0000" style=dashed];\n' +
                    '\t"A" -> "B" [arrowhead=vee color="#FFFFFF"];\n' +
                    '}\n';

                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, context edge', function(done) {
                var text =
                    '# H1\n' +
                    '<!-- @e -> H2 -->';
                var expected =
                    'digraph G {\n' +
                    '\t"H1" -> "H2";\n' +
                    '}\n';

                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, doc_dotex', function(done) {
                var text = fs.readFileSync(dotexExampleFile, 'utf8');
                var expected =
                    'digraph "Graph" {\n' +
                    '\tcenter=true;\n' +
                    '\trankdir=TB;\n' +
                    '\tnode [color="#00FF00" fillcolor="#0000FF" style=filled];\n' +
                    '\tedge [color="#000000"];\n' +
                    '\t"H1" [URL="#h1"];\n' +
                    '\t"SH11" [color="#FFFF00" label=<SH<BR>1.1> URL="#sh11"];\n' +
                    '\t"SH12" [color="#FF0000" URL="#sh-1-2"];\n' +
                    '\t"H1" -> "SH12" [color="#FF0000" label=<<B>H1</B>>];\n' +
                    '\t"SH11" -> "H1";\n' +
                    '\t"SH12" -> "SH11" [color="#00FFFF"];\n' +
                    '\t"SH11" -> "SH12" [color="#00FFFF" style=dashed];\n' +
                    '}\n';

                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, doc_multi_dotex', function(done) {
                var text = fs.readFileSync(multiDotexExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"H0";\n' +
                    '\t"H1" [URL=\"#h1\"];\n' +
                    '\t"H1" -> "H0";\n' +
                    '}\n';
                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, doc_multi_dotex', function(done) {
                var text = fs.readFileSync(multiDotexExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"H0";\n' +
                    '\t"H1" [URL=\"#h1\"];\n' +
                    '\t"H1" -> "H0";\n' +
                    '}\n';
                graphextract.extract(text, { mode: 'dotex' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, doc_multi_dotex, group []', function(done) {
                var text = fs.readFileSync(multiDotexExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"H0";\n' +
                    '\t"H1" [URL=\"#h1\"];\n' +
                    '\t"H1" -> "H0";\n' +
                    '}\n';
                graphextract.extract(text, { mode: 'dotex', group: null }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, doc_multi_dotex, group [alpha]', function(done) {
                var text = fs.readFileSync(multiDotexExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"H0";\n' +
                    '\t"H1" [URL=\"#h1\"];\n' +
                    '\t"SH11" [URL=\"#sh11\"];\n' +
                    '\t"SH_1_2" [href=\"#head-1-2\"];\n' +
                    '\t"H1" -> "H0";\n' +
                    '\t"SH11" -> "H1";\n' +
                    '\t"SH_1_2" -> "SH11";\n' +
                    '}\n';
                graphextract.extract(text, { mode: 'dotex', group: 'alpha' }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, doc_multi_dotex, group [alpha, b]', function(done) {
                var text = fs.readFileSync(multiDotexExampleFile, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"H0";\n' +
                    '\t"H01";\n' +
                    '\t"H1" [URL=\"#h1\"];\n' +
                    '\t"SH11" [URL=\"#sh11\"];\n' +
                    '\t"SH_1_2" [href=\"#head-1-2\"];\n' +
                    '\t"H1" -> "H0";\n' +
                    '\t"H1" -> "H01";\n' +
                    '\t"SH11" -> "H1";\n' +
                    '\t"SH_1_2" -> "SH11";\n' +
                    '}\n';
                graphextract.extract(text, { mode: 'dotex', group: ['alpha', 'b'] }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, doc_multi_dotex_2, group [X]', function(done) {
                var text = fs.readFileSync(multiDotexExampleFile2, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"A";\n' +
                    '\t"B" [label=bee];\n' +
                    '\t"D";\n' +
                    '\t"E";\n' +
                    '\t"A" -> "B";\n' +
                    '}\n';
                graphextract.extract(text, { mode: 'dotex', group: ['X'] }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

            it('dotex mode, doc_multi_dotex_2, group [Y]', function(done) {
                var text = fs.readFileSync(multiDotexExampleFile2, 'utf8');
                var expected =
                    'digraph G {\n' +
                    '\t"B" [label=bee];\n' +
                    '\t"C";\n' +
                    '\t"D";\n' +
                    '\t"E";\n' +
                    '\t"B" -> "C";\n' +
                    '}\n';
                graphextract.extract(text, { mode: 'dotex', group: ['Y'] }, function(result) {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });

        });

        describe('with buffer', function () {

            it('autograph mode', function (done) {
                var buffer = fs.readFileSync(autographExampleFile);
                var expected = autographResult;
                graphextract.extract(buffer, { encoding: 'utf8', noAutoRefs: true }, function(result) {
                    assert.equal(result.toString('utf8'), expected, 'dot output does not equal expectation');
                    done();
                });
            });

        });

    });

    describe('graphextract()', function () {

        it('should pass empty files', function (done) {
            var f = { isNull: function() { return true; } }
            var ge = graphextract();
            ge.on('data', function(data) {
                assert(data === f);
            });
            ge.on('end', function() {
                done();
            });
            ge.write(f);
            ge.end();
        });

        it('should work with file buffer', function (done) {
            var f = new File({
                path: 'data/doc_autograph.md',
                contents: fs.readFileSync(autographExampleFile)
            });

            var expected = autographResult;
            var ge = graphextract({ encoding: 'utf8', noAutoRefs: true });
            ge.on('data', function(data) {
                assert(data.isBuffer(), 'content is a buffer');
                assert.equal(data.contents.toString('utf8'), expected, 'dot output does not equal expectation');
            });
            ge.on('end', function() {
                done();
            });
            ge.write(f);
            ge.end();
        });

        it('should work with file streams', function (done) {
            var f = new File({
                path: 'data/doc_autograph.md',
                contents: fs.createReadStream(autographExampleFile)
            });

            var expected = autographResult;
            var result = '';
            var ge = graphextract({ encoding: 'utf8', noAutoRefs: true });
            ge.on('data', function(data) {
                assert(data.isStream(), 'content is a stream');
                data.contents.on('data', function (data) {
                    result += data;
                });
                data.contents.on('end', function () {
                    assert.equal(result, expected, 'dot output does not equal expectation');
                    done();
                });
            });
            ge.write(f);
            ge.end();
        });

        it('should change file name extension', function (done) {
            var f = new File({
                cwd: 'tests/',
                base: 'data/',
                path: 'data/doc_autograph.md',
                contents: fs.readFileSync(autographExampleFile)
            });

            var ge = graphextract();
            ge.on('data', function(data) {
                assert.equal(path.extname(data.path), '.gv');
            });
            ge.on('end', function() {
                done();
            });
            ge.write(f);
            ge.end();
        });

    });

});
