# Archive reader tests

`node tests/zimkit.test.js [xz-vector-dir] [zim-testing-suite/data]`

1. XZ reference vectors: `python3 tests/xzvec.py /tmp/xzvec` (Python's `lzma`), plus one multi-block stream from the `xz` tool:
   `head -c 2500000 <any file> > /tmp/xzvec/multiblock.raw && xz -k -T4 --block-size=400KiB -c /tmp/xzvec/multiblock.raw > /tmp/xzvec/multiblock.xz`
2. ZIM archives: `git clone https://github.com/openzim/zim-testing-suite` and pass its `data/` folder.

What it checks: every vector decodes byte-for-byte and ignores trailing bytes; truncated input throws; all three ZIM layouts
(old namespaces, new namespaces, no header title list) open, list, search and read every entry; XZ and Zstandard copies of the
same archive yield byte-identical assets; split archives read identically to the whole file; every deliberately damaged archive
is rejected or reported without crashing or hanging.
