<!--
@graph Graph: center=true
@graph-attributes rankdir=TB
@node-attributes color=#00FF00 style=filled, fillcolor=#0000FF
@edge-attributes color=#000000
@node-type nt1: color=#FF0000
@edge-type et1: color=#00FFFF
-->
<!-- @node <nt1>: this="is invalid" -->

# H1
<!-- @node -->
<!-- @edge H1 -> SH12: color=#FF0000 label="<B>H1</B>" -->
<!-- @e <- SH11 -->

```html
<!--
@node Ignore <this>
@node Ignore 2
-->
<!-- @edge Ignore -> Ignore 2 -->
```

## SH11
<!-- @n color=#FFFF00, label=SH<BR>1.1 -->

## SH12 {#sh-1-2}
<!-- @n <nt1> -->
<!-- @e -> SH11 <et1> -->
<!-- @e SH11 -> SH12 <et1>: style=dashed -->
