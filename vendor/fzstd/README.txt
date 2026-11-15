fzstd 0.1.1 (MIT) - https://github.com/101arrowz/fzstd
Cloned from GitHub at commit 4527daeb1fd8e5c3cff89262fc0d779593e5f2fd.
fzstd.js = src/index.ts compiled with tsc --target ES2019, exports removed,
wrapped as HAVYN_FZSTD, plus decompressFrame() (decode one frame, ignore trailing bytes).
Used by HAVYN's archive reader (zimkit.js) to read Kiwix ZIM clusters compressed with Zstandard.
