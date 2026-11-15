"""Generate the vault drive kit from HAVYN's archive catalog (src/content.js):
vault/get-vault.sh (macOS/Linux, bash 3.2+), vault/get-vault.ps1 (Windows PowerShell 5+), vault/START-HERE.html."""
import html, json
from pathlib import Path

def manifest(content):
    rows = []
    for it in content["archive"]["items"]:
        g = it.get("get")
        if not g or it["tier"] not in ("phone", "drive"): continue
        st = "core" if it.get("core") else "full"
        folder = it.get("dir", "misc")
        title = it["t"].replace("\t", " ")
        if "zim" in g: rows.append([it["id"], st, "zim", folder, g["zim"], g["stem"], "0", title])
        elif "url" in g: rows.append([it["id"], st, "url", folder, g["url"], g["name"], "0", title])
        elif "gh" in g: rows.append([it["id"], st, "gh", folder, g["gh"], g["match"], "1" if g.get("all") else "0", title])
        elif "kx" in g: rows.append([it["id"], st, "kx", folder, g["kx"], g["match"], "1" if g.get("all") else "0", title])
    for r in rows:
        for c in r: assert "\t" not in c and "\n" not in c and c != "", r
    return rows

def shelf_dirs(content):
    import re
    return {s["id"]: "10-shelf/%s-%s" % (s["n"], re.sub(r"[^a-z0-9]+", "-", s["t"].lower()).strip("-")) for s in content["shelf"]["systems"]}

def shelf_fallback(content):
    """Publisher links for single-file shelf documents. The script prefers the checked list the shelf workflow
    publishes on GitHub (shelf-files.tsv: mirror links, chapter lists and SHA-256s) and uses these only if it can't reach it."""
    d = shelf_dirs(content); rows = []
    for it in content["shelf"]["items"]:
        if not it.get("src"): continue
        rows.append([it["id"], "core" if it.get("core") else "full", d[it["sys"]], it["file"], it["src"][0], "-", str(it.get("size", 0)), it["t"].replace("\t", " ")])
    for r in rows:
        for c in r: assert "\t" not in c and "\n" not in c and c != "", r
    return rows

def start_here(content, version):
    A = content["archive"]
    groups = [("01-phone-set", "Phone set", "Open these on any iPhone: in HAVYN tap Add files and pick them here (Files › the drive). They also open in Kiwix."),
              ("02-encyclopedias", "Encyclopedias", "Wikipedia, Wikivoyage, the dictionary and textbooks. Open in Kiwix on a laptop or phone, or Add files in HAVYN."),
              ("03-medical", "Medical", "Medical encyclopedias and drug references. Some are website copies that need Kiwix."),
              ("04-skills-and-repair", "Skills and repair", "Ready.gov, iFixit, Appropedia and Q&A archives for home, car, garden and radio."),
              ("05-video", "Video", "Video archives. Open them in Kiwix (iOS 17 or later on iPhone)."),
              ("06-books", "Books", "Project Gutenberg collections."),
              ("07-ai", "Offline AI", "A single-file AI assistant for any laptop. Mac/Linux: open Terminal here and run it. Windows: rename it to end in .exe and double-click. It can be wrong: the emergency cards win."),
              ("08-software", "Software", "Installers for Kiwix, VLC, radios, maps and servers, for Windows, Mac, Linux, Android and Raspberry Pi."),
              ("09-builder", "Builder", "Programming references, if you chose everything."),
              ("10-shelf", "Reference shelf", "Real manuals and guides by system: medicine, water, sanitation, food, building, power, radio, tools, response, family, science and maps. Open them in HAVYN (Library › Add files) or any PDF reader. Hesperian books come as chapter folders: in HAVYN, select every chapter at once and it joins them into one book.")]
    rows = "".join(f"<tr><td><b>{html.escape(f)}</b></td><td>{html.escape(t)}</td><td>{html.escape(d)}</td></tr>" for f, t, d in groups)
    items = "".join(f"<li><b>{html.escape(i['t'])}</b> — {html.escape(i['d'])}</li>" for i in A["items"] if i["tier"] in ("phone", "drive") and i.get("get"))
    items += "".join(f"<li><b>{html.escape(i['t'])}</b> ({html.escape(i['by'])}) — {html.escape(i['d'])}</li>" for i in content["shelf"]["items"])
    hub = "".join(f"<li><b>{html.escape(i['t'])}</b> — {html.escape(i['d'])}</li>" for i in A["items"] if i["tier"] == "hub")
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HAVYN VAULT — start here</title>
<style>body{{font:16px/1.5 -apple-system,system-ui,Segoe UI,sans-serif;margin:0;padding:24px;max-width:860px;color:#111;background:#fff}}
h1{{font-size:1.6rem;margin:0 0 4px}}h2{{margin-top:28px;font-size:1.15rem}}table{{border-collapse:collapse;width:100%}}td{{border-top:1px solid #ddd;padding:8px 6px;vertical-align:top}}
.note{{background:#f3f6ff;border:1px solid #cfd8ff;border-radius:10px;padding:12px 14px}}code{{background:#eee;padding:1px 5px;border-radius:4px}}</style></head><body>
<h1>HAVYN VAULT</h1><p>The family's offline library. Made by the HAVYN vault script ({html.escape(version)}); catalog checked {html.escape(A['checked'])}.</p>
<div class="note"><b>In an emergency:</b> the emergency cards and playbooks live in the HAVYN app on every phone and in the printed binder. This drive is the deep library behind them.</div>
<h2>What's in each folder</h2><table>{rows}</table>
<h2>Open it on an iPhone</h2><ol><li>Plug the drive in (USB-C iPhones directly; older iPhones need Apple's Lightning to USB 3 adapter).</li><li>HAVYN → Library → <b>Add files</b> → Browse → the drive → pick a file in <code>01-phone-set</code>. HAVYN keeps its own copy.</li><li>Big archives and video: open them in the <b>Kiwix</b> app instead (Files → long-press the file → Share → Kiwix).</li></ol>
<h2>Share it with every phone (home library)</h2><ul>{hub}</ul>
<h2>Keep it current</h2><p>Run the same script again: it fetches newer versions, resumes unfinished downloads, re-checks checksums, and removes older copies of the same archive. Keep a second drive in sync and store one away from home.</p>
<h2>Everything the script fetches</h2><ul>{items}</ul>
<p style="color:#666;font-size:.9rem">Archives by Kiwix (kiwix.org) and their original publishers, under their own licenses. HAVYN: github.com/hourglazlabs-x/havyn</p>
</body></html>
"""

def bash_script(rows, start_html, version, shelf_rows):
    man = "\n".join("\t".join(r) for r in rows)
    shelf_man = "\n".join("\t".join(r) for r in shelf_rows)
    return r'''#!/bin/bash
# HAVYN VAULT — fills a USB drive with the family's offline library.
# Generated from HAVYN's archive catalog (''' + version + r''').
#   bash get-vault.sh /Volumes/HAVYN-VAULT          core set (about 165 GB)
#   bash get-vault.sh /Volumes/HAVYN-VAULT --full   everything (about 425 GB)
#   bash get-vault.sh /Volumes/HAVYN-VAULT --list   show what it would fetch
# Downloads the newest copy of each item, resumes after interruptions, and checks
# every Kiwix archive against the SHA-256 checksum Kiwix publishes. Safe to re-run.
set -u
FULL=0; LIST=0; DEST=""
for a in "$@"; do case "$a" in --full) FULL=1;; --list) LIST=1;; -h|--help) sed -n '2,9p' "$0" 2>/dev/null; exit 0;; *) DEST="$a";; esac; done
if [ -z "$DEST" ]; then echo "Usage: bash get-vault.sh /Volumes/HAVYN-VAULT [--full] [--list]"; exit 1; fi
if [ ! -d "$DEST" ]; then echo "Can't find $DEST. Plug in the drive and check its name (Finder shows it under Locations)."; exit 1; fi
command -v curl >/dev/null 2>&1 || { echo "This needs curl."; exit 1; }
ROOT="$DEST/HAVYN-VAULT"; mkdir -p "$ROOT/logs" || { echo "Can't write to $DEST."; exit 1; }
LOG="$ROOT/logs/get-vault-$(date +%Y%m%d-%H%M%S).log"; VER="$ROOT/logs/verified.txt"; touch "$VER"
KIWIX="${HAVYN_KIWIX_BASE:-https://download.kiwix.org/zim}"
GHAPI="${HAVYN_GH_API:-https://api.github.com}"
ONLY=",${HAVYN_ONLY:-},"   # optional: HAVYN_ONLY=p-wikimed,d-ifixit fetches just those
UA="HAVYN-vault/1.4 (+https://github.com/hourglazlabs-x/havyn)"
if command -v shasum >/dev/null 2>&1; then SHA="shasum -a 256"; elif command -v sha256sum >/dev/null 2>&1; then SHA="sha256sum"; else SHA=""; fi
ok=0; failed=0; n=0
say() { printf '%s\n' "$*"; printf '%s\n' "$*" >> "$LOG"; }
fsize() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0; }
free_mb() { df -Pk "$ROOT" | awk 'NR==2{printf "%d", $4/1024}'; }
remote_size() { curl -sIL -A "$UA" --connect-timeout 30 "$1" 2>/dev/null | tr -d '\r' | awk 'tolower($1)=="content-length:"{n=$2} END{printf "%d", n+0}'; }
fetch() { # url out
  url="$1"; out="$2"; part="$2.part"
  if [ -f "$out" ]; then say "  already on the drive"; return 0; fi
  rs=$(remote_size "$url")
  if [ -f "$part" ] && [ "$rs" -gt 0 ] && [ "$(fsize "$part")" -ge "$rs" ]; then mv "$part" "$out"; return 0; fi
  if [ "$rs" -gt 0 ]; then need=$(( rs / 1048576 + 64 )); fr=$(free_mb); if [ "$fr" -lt "$need" ]; then say "  not enough space: ${fr} MB free, needs ${need} MB"; return 2; fi; say "  $(( rs / 1000000 )) MB"; fi
  if ! curl -fL --retry 6 --retry-delay 10 --connect-timeout 30 -A "$UA" -C - -o "$part" "$url"; then say "  download stopped; run the script again to resume"; return 1; fi
  mv "$part" "$out"
}
verify() { # url out
  url="$1"; out="$2"; base=$(basename "$out")
  [ -z "$SHA" ] && return 0
  grep -qxF "$base" "$VER" 2>/dev/null && return 0
  want=$(curl -fsSL -A "$UA" "$url.sha256" 2>/dev/null | awk '{print $1; exit}' | tr 'A-F' 'a-f')
  if [ "${#want}" -ne 64 ]; then say "  (no published checksum)"; return 0; fi
  say "  checking checksum…"
  got=$($SHA "$out" | awk '{print $1}')
  if [ "$got" = "$want" ]; then echo "$base" >> "$VER"; say "  checksum OK"; return 0; fi
  say "  checksum mismatch: deleted, run again to re-download"; rm -f "$out"; return 1
}
latest_zim() { # kiwix-dir stem
  re=$(printf '%s' "$2" | sed 's/[.[\*^$]/\\&/g')
  curl -fsSL -A "$UA" --connect-timeout 30 "$KIWIX/$1/" 2>/dev/null | grep -o "${re}_[0-9]\{4\}-[0-9]\{2\}\.zim" | sort -u | tail -1
}
prune_old() { # dir stem keep
  for g in "$1/$2"_[0-9][0-9][0-9][0-9]-[0-9][0-9].zim; do [ -e "$g" ] || continue; [ "$(basename "$g")" = "$3" ] && continue; rm -f "$g" && say "  removed older copy $(basename "$g")"; done
}
newest() { awk '{k=$0; sub(/[0-9][0-9.-]*\.(zip|tar\.gz|exe|dmg|apk|appimage|AppImage|msi)$/, "", k); last[k]=$0} END{for (k in last) print last[k]}'; }
say "HAVYN VAULT → $ROOT  ($( [ "$FULL" -eq 1 ] && echo everything || echo 'core set'))"
say "Free space: $(( $(free_mb) / 1024 )) GB. Started $(date)."
TAB=$(printf '\t')
while IFS="$TAB" read -r id set type folder a b all title; do
  [ -z "$id" ] && continue
  if [ "$ONLY" != ",," ]; then case "$ONLY" in *",$id,"*) ;; *) continue;; esac
  elif [ "$FULL" -eq 0 ] && [ "$set" != "core" ]; then continue; fi
  n=$((n+1)); say ""; say "[$n] $title"
  if [ "$LIST" -eq 1 ]; then say "  $type $a $b → $folder"; continue; fi
  mkdir -p "$ROOT/$folder"
  case "$type" in
    zim)
      f=$(latest_zim "$a" "$b")
      if [ -z "$f" ]; then for alt in other zimit videos ted; do f=$(latest_zim "$alt" "$b"); if [ -n "$f" ]; then a="$alt"; break; fi; done; fi
      if [ -z "$f" ]; then say "  not in the Kiwix library today; skipped"; failed=$((failed+1)); continue; fi
      say "  $f"
      if fetch "$KIWIX/$a/$f" "$ROOT/$folder/$f" && verify "$KIWIX/$a/$f" "$ROOT/$folder/$f"; then ok=$((ok+1)); prune_old "$ROOT/$folder" "$b" "$f"; else failed=$((failed+1)); fi ;;
    url)
      if fetch "$a" "$ROOT/$folder/$b"; then ok=$((ok+1)); else failed=$((failed+1)); fi ;;
    gh)
      list=$(curl -fsSL -A "$UA" "$GHAPI/repos/$a/releases/latest" 2>/dev/null | grep -o '"browser_download_url": *"[^"]*"' | sed 's/.*"\(http[^"]*\)"$/\1/' | grep -E "$b")
      [ "$all" = "1" ] || list=$(printf '%s\n' "$list" | head -1)
      if [ -z "$list" ]; then say "  no matching release file found; skipped"; failed=$((failed+1)); continue; fi
      for u in $list; do say "  $(basename "$u")"; if fetch "$u" "$ROOT/$folder/$(basename "$u")"; then ok=$((ok+1)); else failed=$((failed+1)); fi; done ;;
    kx)
      list=$(curl -fsSL -A "$UA" "$a" 2>/dev/null | grep -oE "$b" | sort -u | newest | sort)
      [ "$all" = "1" ] || list=$(printf '%s\n' "$list" | tail -1)
      if [ -z "$list" ]; then say "  no matching file found at $a; skipped"; failed=$((failed+1)); continue; fi
      for f in $list; do say "  $f"; if fetch "$a$f" "$ROOT/$folder/$f"; then ok=$((ok+1)); else failed=$((failed+1)); fi; done ;;
  esac
done <<'MANIFEST'
''' + man + r'''
MANIFEST
# ---- reference shelf: manuals and guides, checked by HAVYN's shelf workflow ----
SHELF_URL="${HAVYN_SHELF_TSV:-https://github.com/hourglazlabs-x/havyn/releases/download/shelf/shelf-files.tsv}"
STSV="$ROOT/logs/shelf-files.tsv"
say ""
if curl -fsSL -A "$UA" --connect-timeout 30 -o "$STSV.new" "$SHELF_URL" 2>/dev/null && [ -s "$STSV.new" ] && grep -q "$TAB" "$STSV.new"; then
  mv "$STSV.new" "$STSV"; say "Reference shelf (checked list from GitHub)"
else
  rm -f "$STSV.new"; cat > "$STSV" <<'SHELF'
''' + shelf_man + r'''
SHELF
  say "Reference shelf (GitHub list unavailable: publisher links)"
fi
while IFS="$TAB" read -r id set folder file url sha size title; do
  [ -z "$id" ] && continue
  if [ "$ONLY" != ",," ]; then case "$ONLY" in *",$id,"*) ;; *) continue;; esac
  elif [ "$FULL" -eq 0 ] && [ "$set" != "core" ]; then continue; fi
  n=$((n+1)); say ""; say "[$n] $title · $file"
  if [ "$LIST" -eq 1 ]; then say "  shelf $url → $folder"; continue; fi
  mkdir -p "$ROOT/$folder"; out="$ROOT/$folder/$file"
  if fetch "$url" "$out"; then
    if [ -n "$SHA" ] && [ "${#sha}" -eq 64 ] && ! grep -qxF "$folder/$file" "$VER" 2>/dev/null; then
      got=$($SHA "$out" | awk '{print $1}')
      if [ "$got" = "$sha" ]; then echo "$folder/$file" >> "$VER"; say "  checksum OK"; ok=$((ok+1))
      else case "$url" in
        *"/releases/download/"*) say "  checksum mismatch: deleted, run again to re-download"; rm -f "$out"; failed=$((failed+1));;
        *) say "  (the publisher has changed this file since HAVYN checked it; kept)"; ok=$((ok+1));;
      esac; fi
    else ok=$((ok+1)); fi
  else failed=$((failed+1)); fi
done < "$STSV"
if [ "$LIST" -eq 0 ]; then
cat > "$ROOT/START-HERE.html" <<'HAVYNHTML'
''' + start_html + r'''HAVYNHTML
fi
say ""; say "Done: $ok fetched or already here, $failed need another run. Free space: $(( $(free_mb) / 1024 )) GB."
say "Log: $LOG"
[ "$failed" -eq 0 ] || say "Run the same command again to finish the rest."
'''

def ps_script(rows, start_html, version, shelf_rows):
    man = "\n".join("\t".join(r) for r in rows)
    shelf_man = "\n".join("\t".join(r) for r in shelf_rows)
    return r'''# HAVYN VAULT — fills a USB drive with the family's offline library (Windows).
# Generated from HAVYN's archive catalog (''' + version + r''').
#   powershell -ExecutionPolicy Bypass -File .\get-vault.ps1 -Drive E:\          core set (about 165 GB)
#   powershell -ExecutionPolicy Bypass -File .\get-vault.ps1 -Drive E:\ -Full    everything (about 425 GB)
# Downloads the newest copy of each item, resumes after interruptions, and checks every Kiwix
# archive against the SHA-256 checksum Kiwix publishes. Safe to re-run. Needs Windows 10 or later.
param([string]$Drive = "", [switch]$Full, [switch]$List)
$ProgressPreference = "SilentlyContinue"
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
if (-not $Drive) { Write-Host "Usage: .\get-vault.ps1 -Drive E:\ [-Full] [-List]"; exit 1 }
if (-not (Test-Path $Drive)) { Write-Host "Can't find $Drive. Plug in the drive and check its letter in File Explorer."; exit 1 }
if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) { Write-Host "This needs curl.exe (built into Windows 10 and 11)."; exit 1 }
$Root = Join-Path $Drive "HAVYN-VAULT"; New-Item -ItemType Directory -Force -Path (Join-Path $Root "logs") | Out-Null
$Log = Join-Path $Root ("logs\get-vault-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
$Ver = Join-Path $Root "logs\verified.txt"; if (-not (Test-Path $Ver)) { New-Item -ItemType File -Path $Ver | Out-Null }
$Kiwix = $(if ($env:HAVYN_KIWIX_BASE) { $env:HAVYN_KIWIX_BASE } else { "https://download.kiwix.org/zim" })
$GhApi = $(if ($env:HAVYN_GH_API) { $env:HAVYN_GH_API } else { "https://api.github.com" })
$Only = @(); if ($env:HAVYN_ONLY) { $Only = $env:HAVYN_ONLY.Split(",") }
$UA = "HAVYN-vault/1.4 (+https://github.com/hourglazlabs-x/havyn)"
$ok = 0; $failed = 0; $n = 0
function Say([string]$m) { Write-Host $m; Add-Content -Path $Log -Value $m }
function Page([string]$u) { try { (Invoke-WebRequest -UseBasicParsing -UserAgent $UA -Uri $u -TimeoutSec 180).Content } catch { "" } }
function FreeMB() { try { [int64]((Get-PSDrive -Name ($Root.Substring(0,1))).Free / 1MB) } catch { [int64]::MaxValue } }
function RemoteSize([string]$u) { $h = & curl.exe -sIL -A $UA --connect-timeout 30 $u 2>$null; $s = 0; foreach ($l in $h) { if ($l -match '^(?i)content-length:\s*(\d+)') { $s = [int64]$Matches[1] } }; return $s }
function Fetch([string]$u, [string]$out) {
  if (Test-Path $out) { Say "  already on the drive"; return $true }
  $part = "$out.part"; $rs = RemoteSize $u
  if ((Test-Path $part) -and $rs -gt 0 -and ((Get-Item $part).Length -ge $rs)) { Move-Item -Force $part $out; return $true }
  if ($rs -gt 0) { $need = [int64]($rs / 1MB) + 64; $fr = FreeMB; if ($fr -lt $need) { Say "  not enough space: $fr MB free, needs $need MB"; return $false }; Say ("  " + [int64]($rs / 1000000) + " MB") }
  & curl.exe -fL --retry 6 --retry-delay 10 --connect-timeout 30 -A $UA -C - -o $part $u
  if ($LASTEXITCODE -ne 0) { Say "  download stopped; run the script again to resume"; return $false }
  Move-Item -Force $part $out; return $true
}
function Verify([string]$u, [string]$out) {
  $base = Split-Path $out -Leaf
  if ((Get-Content $Ver -ErrorAction SilentlyContinue) -contains $base) { return $true }
  $want = ((Page "$u.sha256") -split '\s+')[0]
  if (-not $want -or $want.Length -ne 64) { Say "  (no published checksum)"; return $true }
  Say "  checking checksum..."
  $got = (Get-FileHash -Algorithm SHA256 -Path $out).Hash
  if ($got -ieq $want) { Add-Content -Path $Ver -Value $base; Say "  checksum OK"; return $true }
  Say "  checksum mismatch: deleted, run again to re-download"; Remove-Item -Force $out; return $false
}
function LatestZim([string]$dir, [string]$stem) {
  $m = [regex]::Matches((Page "$Kiwix/$dir/"), [regex]::Escape($stem) + '_\d{4}-\d{2}\.zim') | ForEach-Object { $_.Value } | Sort-Object -Unique
  if ($m) { return @($m)[-1] } else { return "" }
}
function Newest($names) { $g = @{}; foreach ($x in ($names | Sort-Object)) { $k = $x -replace '[0-9][0-9.-]*\.(zip|tar\.gz|exe|dmg|apk|appimage|msi)$', ''; $g[$k] = $x }; return @($g.Values | Sort-Object) }
$manifest = @'
''' + man + r'''
'@
Say ("HAVYN VAULT -> $Root  (" + $(if ($Full) { "everything" } else { "core set" }) + ")")
Say ("Free space: " + [int64]((FreeMB) / 1024) + " GB. Started " + (Get-Date))
foreach ($line in ($manifest -split "`r?`n")) {
  if (-not $line.Trim()) { continue }
  $p = $line.Split("`t"); $id, $set, $type, $folder, $a, $b, $all, $title = $p
  if ($Only.Count -gt 0) { if ($Only -notcontains $id) { continue } } elseif (-not $Full -and $set -ne "core") { continue }
  $n++; Say ""; Say "[$n] $title"
  if ($List) { Say "  $type $a $b -> $folder"; continue }
  $dirPath = Join-Path $Root ($folder -replace '/', '\'); New-Item -ItemType Directory -Force -Path $dirPath | Out-Null
  switch ($type) {
    "zim" {
      $f = LatestZim $a $b
      if (-not $f) { foreach ($alt in @("other", "zimit", "videos", "ted")) { $f = LatestZim $alt $b; if ($f) { $a = $alt; break } } }
      if (-not $f) { Say "  not in the Kiwix library today; skipped"; $failed++; continue }
      Say "  $f"; $u = "$Kiwix/$a/$f"; $out = Join-Path $dirPath $f
      if ((Fetch $u $out) -and (Verify $u $out)) {
        $ok++
        Get-ChildItem -Path $dirPath -Filter "$($b)_*.zim" | Where-Object { $_.Name -match ('^' + [regex]::Escape($b) + '_\d{4}-\d{2}\.zim$') -and $_.Name -ne $f } | ForEach-Object { Remove-Item -Force $_.FullName; Say "  removed older copy $($_.Name)" }
      } else { $failed++ }
    }
    "url" { if (Fetch $a (Join-Path $dirPath $b)) { $ok++ } else { $failed++ } }
    "gh" {
      try { $r = Invoke-RestMethod -UserAgent $UA -Uri "$GhApi/repos/$a/releases/latest"; $urls = @($r.assets | Where-Object { $_.browser_download_url -match $b } | ForEach-Object { $_.browser_download_url }) } catch { $urls = @() }
      if ($all -ne "1" -and $urls.Count -gt 0) { $urls = @($urls[0]) }
      if ($urls.Count -eq 0) { Say "  no matching release file found; skipped"; $failed++; continue }
      foreach ($u in $urls) { $nm = Split-Path $u -Leaf; Say "  $nm"; if (Fetch $u (Join-Path $dirPath $nm)) { $ok++ } else { $failed++ } }
    }
    "kx" {
      $names = [regex]::Matches((Page $a), $b) | ForEach-Object { $_.Value } | Sort-Object -Unique
      $names = Newest $names
      if ($all -ne "1" -and $names.Count -gt 0) { $names = @($names[-1]) }
      if ($names.Count -eq 0) { Say "  no matching file found at $a; skipped"; $failed++; continue }
      foreach ($f in $names) { Say "  $f"; if (Fetch ($a + $f) (Join-Path $dirPath $f)) { $ok++ } else { $failed++ } }
    }
  }
}
# ---- reference shelf: manuals and guides, checked by HAVYN's shelf workflow ----
$shelfFallback = @'
''' + shelf_man + r'''
'@
$ShelfUrl = $(if ($env:HAVYN_SHELF_TSV) { $env:HAVYN_SHELF_TSV } else { "https://github.com/hourglazlabs-x/havyn/releases/download/shelf/shelf-files.tsv" })
$stsv = Join-Path $Root "logs\shelf-files.tsv"
& curl.exe -fsSL -A $UA --connect-timeout 30 -o "$stsv.new" $ShelfUrl 2>$null
Say ""
if ($LASTEXITCODE -eq 0 -and (Test-Path "$stsv.new") -and ((Get-Content -Raw -Encoding UTF8 "$stsv.new") -match "`t")) { Move-Item -Force "$stsv.new" $stsv; Say "Reference shelf (checked list from GitHub)" }
else { Remove-Item -Force "$stsv.new" -ErrorAction SilentlyContinue; Set-Content -Path $stsv -Value $shelfFallback -Encoding UTF8; Say "Reference shelf (GitHub list unavailable: publisher links)" }
foreach ($line in ((Get-Content -Raw -Encoding UTF8 $stsv) -split "`r?`n")) {
  if (-not $line.Trim()) { continue }
  $id, $set, $folder, $file, $url, $sha, $size, $title = $line.Split("`t")
  if ($Only.Count -gt 0) { if ($Only -notcontains $id) { continue } } elseif (-not $Full -and $set -ne "core") { continue }
  $n++; Say ""; Say "[$n] $title - $file"
  if ($List) { Say "  shelf $url -> $folder"; continue }
  $dirPath = Join-Path $Root ($folder -replace '/', '\'); New-Item -ItemType Directory -Force -Path $dirPath | Out-Null
  $out = Join-Path $dirPath $file; $key = "$folder/$file"
  if (Fetch $url $out) {
    if ($sha.Length -eq 64 -and -not ((Get-Content $Ver -ErrorAction SilentlyContinue) -contains $key)) {
      $got = (Get-FileHash -Algorithm SHA256 -Path $out).Hash
      if ($got -ieq $sha) { Add-Content -Path $Ver -Value $key; Say "  checksum OK"; $ok++ }
      elseif ($url -like "*/releases/download/*") { Say "  checksum mismatch: deleted, run again to re-download"; Remove-Item -Force $out; $failed++ }
      else { Say "  (the publisher has changed this file since HAVYN checked it; kept)"; $ok++ }
    } else { $ok++ }
  } else { $failed++ }
}
if (-not $List) {
$html = @'
''' + start_html + r'''
'@
Set-Content -Path (Join-Path $Root "START-HERE.html") -Value $html -Encoding UTF8
}
Say ""; Say "Done: $ok fetched or already here, $failed need another run. Free space: $([int64]((FreeMB) / 1024)) GB."
Say "Log: $Log"
if ($failed -gt 0) { Say "Run the same command again to finish the rest." }
'''

def write(root, content, version):
    rows = manifest(content)
    srows = shelf_fallback(content)
    sh = start_here(content, version)
    out = root / "vault"; out.mkdir(exist_ok=True)
    (out / "START-HERE.html").write_text(sh, encoding="utf-8")
    (out / "get-vault.sh").write_text(bash_script(rows, sh, version, srows), encoding="utf-8")
    # UTF-8 with BOM so Windows PowerShell 5.1 reads the non-ASCII text correctly.
    (out / "get-vault.ps1").write_text(ps_script(rows, sh, version, srows).replace("\n", "\r\n"), encoding="utf-8-sig")
    (out / "get-vault.sh").chmod(0o755)
    return rows
