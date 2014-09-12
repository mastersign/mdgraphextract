<!-- 
@graph MyGraph: bgcolor=azure
@node-attributes fontname=Helvetica
@node-attributes shape=rect style="filled, rounded" fillcolor=#A0D0FF
@edge-attributes color=#2040C0
@node-type important: fillcolor=#FFD0A0
@edge-type weak: style=dashed
-->

# First Chapter
<!-- @node -->
<!-- @edge -> Section 1.1 <weak> -->
<!-- @edge -> Section 1.2 <weak> -->
Text paragraph is weakly linked with Section 1.1 and 1.2.

## Section 1.1
<!-- @node <important>: label="Sect. (1.1)" -->
<!-- @edge -> Second Chapter -->
This section is linked to the Second Chapter.

## Section 1.2
<!-- @node label="Sect. (1.2)" -->
This section stands for its own.

<!-- @node Second Chapter: label="Chapter 2" -->
<!-- @edge Second Chapter -> First Chapter -->
# Second Chapter
And the last chapter is linked with the first chapter.