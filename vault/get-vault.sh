#!/bin/bash
# HAVYN VAULT — fills a USB drive with the family's offline library.
# Generated from HAVYN's archive catalog (1.3.0+4b60c483ec).
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
UA="HAVYN-vault/1.3 (+https://github.com/hourglazlabs-x/havyn)"
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
p-wikimed	core	zim	01-phone-set	wikipedia	wikipedia_en_medicine_maxi	0	WikiMed: medical encyclopedia
p-postdisaster	core	zim	01-phone-set	other	zimgit-post-disaster_en	0	Post-disaster library
p-water	core	zim	01-phone-set	other	zimgit-water_en	0	Water treatment
p-food	core	zim	01-phone-set	other	zimgit-food-preparation_en	0	Food for preppers
p-medlib	core	zim	01-phone-set	other	zimgit-medicine_en	0	Medical library
p-knots	core	zim	01-phone-set	other	zimgit-knots_en	0	A library of knots
p-vikidia	core	zim	01-phone-set	vikidia	vikidia_en_all_maxi	0	Vikidia: encyclopedia for kids
p-wptop	full	zim	01-phone-set	wikipedia	wikipedia_en_top_maxi	0	Wikipedia: the top articles, with pictures
p-wpmini	full	zim	01-phone-set	wikipedia	wikipedia_en_all_mini	0	Wikipedia: every article, short form
p-atp	core	url	01-phone-set	https://irp.fas.org/doddir/army/atp3-50-21.pdf	ATP-3-50.21-Survival-2018.pdf	0	US Army Survival manual (ATP 3-50.21)
p-cert	core	url	01-phone-set	https://www.ready.gov/sites/default/files/2019.CERT_.Basic_.PM_FINAL_508c.pdf	FEMA-CERT-Basic-Training-Participant-Manual-2019.pdf	0	FEMA CERT Basic Training manual
d-wpmaxi	core	zim	02-encyclopedias	wikipedia	wikipedia_en_all_maxi	0	All of Wikipedia, with pictures
d-wpnopic	full	zim	02-encyclopedias	wikipedia	wikipedia_en_all_nopic	0	All of Wikipedia, text only
d-mdwiki	core	zim	03-medical	other	mdwiki_en_all_maxi	0	MDWiki: second medical encyclopedia
d-medline	core	zim	03-medical	zimit	medlineplus.gov_en_all	0	MedlinePlus (US National Library of Medicine)
d-nhsmeds	core	zim	03-medical	zimit	nhs.uk_en_medicines	0	NHS medicines A to Z
d-milmed	core	zim	03-medical	zimit	fas-military-medicine_en	0	Military medicine manuals (FAS archive)
d-ready	core	zim	04-skills-and-repair	zimit	www.ready.gov_en	0	Ready.gov (FEMA)
d-ifixit	core	zim	04-skills-and-repair	ifixit	ifixit_en_all	0	iFixit repair guides
d-appropedia	core	zim	04-skills-and-repair	other	appropedia_en_all_maxi	0	Appropedia
d-se-diy	core	zim	04-skills-and-repair	stack_exchange	diy.stackexchange.com_en_all	0	Home Improvement Q&A (Stack Exchange)
d-se-mech	core	zim	04-skills-and-repair	stack_exchange	mechanics.stackexchange.com_en_all	0	Motor Vehicle Repair Q&A
d-se-garden	core	zim	04-skills-and-repair	stack_exchange	gardening.stackexchange.com_en_all	0	Gardening Q&A
d-se-ham	core	zim	04-skills-and-repair	stack_exchange	ham.stackexchange.com_en_all	0	Amateur Radio Q&A
d-se-cook	core	zim	04-skills-and-repair	stack_exchange	cooking.stackexchange.com_en_all	0	Cooking Q&A (Seasoned Advice)
d-se-outdoors	core	zim	04-skills-and-repair	stack_exchange	outdoors.stackexchange.com_en_all	0	The Great Outdoors Q&A
d-gut-ag	core	zim	06-books	gutenberg	gutenberg_en_lcc-s	0	Project Gutenberg: agriculture books
d-gut-tech	full	zim	06-books	gutenberg	gutenberg_en_lcc-t	0	Project Gutenberg: technology books
d-voyage	core	zim	02-encyclopedias	wikivoyage	wikivoyage_en_all_maxi	0	Wikivoyage
d-wiktionary	full	zim	02-encyclopedias	wiktionary	wiktionary_en_all_nopic	0	Wiktionary: the dictionary
d-wikibooks	full	zim	02-encyclopedias	wikibooks	wikibooks_en_all_maxi	0	Wikibooks: free textbooks
d-wpes	full	zim	02-encyclopedias	wikipedia	wikipedia_es_all_maxi	0	Wikipedia en español
d-v-medguides	core	zim	05-video	videos	quickguidesformedicine_en_all	0	Video: quick guides for medicine
d-v-selfrel	core	zim	05-video	videos	lrnselfreliance_en_all	0	Video: Learn Self Reliance
d-v-food	core	zim	05-video	videos	canadian-prepper_en_preppingfood	0	Video: prepping food (Canadian Prepper)
d-v-tedhealth	full	zim	05-video	ted	ted_mul_health	0	Video: TED talks on health
d-v-crash	full	zim	05-video	videos	crashcourse_en_all	0	Video: Crash Course (school subjects)
d-ai-llama	core	url	07-ai	https://huggingface.co/Mozilla/Llama-3.2-3B-Instruct-llamafile/resolve/main/Llama-3.2-3B-Instruct.Q6_K.llamafile	Llama-3.2-3B-Instruct.Q6_K.llamafile	0	Offline AI assistant (llamafile, Llama 3.2 3B)
s-kiwix-win	core	kx	08-software/windows	https://download.kiwix.org/release/kiwix-desktop/	kiwix-desktop_windows_x64_[0-9][0-9.-]*\.zip	0	Kiwix for Windows
s-kiwix-linux	full	kx	08-software/linux	https://download.kiwix.org/release/kiwix-desktop/	kiwix-desktop_x86_64_[0-9][0-9.-]*\.appimage	0	Kiwix for Linux (AppImage)
s-kiwix-mac	core	kx	08-software/mac	https://download.kiwix.org/release/kiwix-macos/	kiwix-macos_[0-9][0-9.]*\.dmg	0	Kiwix for Mac
s-kiwix-tools	core	kx	08-software/server	https://download.kiwix.org/release/kiwix-tools/	kiwix-tools_(win-x86_64|linux-x86_64|linux-aarch64|macos-arm64|macos-x86_64)-[0-9][0-9.]*\.(zip|tar\.gz)	1	kiwix-serve (server for any computer or Raspberry Pi)
s-kiwix-android	full	kx	08-software/android	https://download.kiwix.org/release/kiwix-android/	kiwix-[0-9][0-9.]*\.apk	0	Kiwix for Android (APK)
s-vlc-win	core	kx	08-software/windows	https://get.videolan.org/vlc/last/win64/	vlc-[0-9][0-9.]*-win64\.exe	0	VLC for Windows
s-vlc-mac	core	kx	08-software/mac	https://get.videolan.org/vlc/last/macosx/	vlc-[0-9][0-9.]*-universal\.dmg	0	VLC for Mac
s-mesh-fw	core	gh	08-software/radios	meshtastic/firmware	firmware-.*\.zip	0	Meshtastic radio firmware
s-mesh-android	full	gh	08-software/android	meshtastic/Meshtastic-Android	\.apk$	0	Meshtastic for Android (APK)
s-omaps-android	full	gh	08-software/android	organicmaps/organicmaps	\.apk$	0	Organic Maps for Android (APK)
s-keepass	full	gh	08-software	keepassxreboot/keepassxc	(Win64\.msi|\.dmg)$	1	KeePassXC password vault
s-rpi	full	gh	08-software/server	raspberrypi/rpi-imager	(\.exe|\.dmg)$	1	Raspberry Pi Imager
s-nomad	full	url	08-software/server	https://github.com/Crosstalk-Solutions/project-nomad/archive/refs/heads/main.zip	project-nomad-main.zip	0	Project N.O.M.A.D. (source)
s-havyn	core	url	08-software	https://github.com/hourglazlabs-x/havyn/archive/refs/heads/main.zip	havyn-main.zip	0	HAVYN itself (source)
b-so	full	zim	09-builder	stack_exchange	stackoverflow.com_en_all	0	Builder: Stack Overflow
b-superuser	full	zim	09-builder	stack_exchange	superuser.com_en_all	0	Builder: Super User
b-electronics	full	zim	09-builder	stack_exchange	electronics.stackexchange.com_en_all	0	Builder: Electrical Engineering Q&A
b-fcc	full	zim	09-builder	freecodecamp	freecodecamp_en_all	0	Builder: freeCodeCamp curriculum
MANIFEST
if [ "$LIST" -eq 0 ]; then
cat > "$ROOT/START-HERE.html" <<'HAVYNHTML'
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HAVYN VAULT — start here</title>
<style>body{font:16px/1.5 -apple-system,system-ui,Segoe UI,sans-serif;margin:0;padding:24px;max-width:860px;color:#111;background:#fff}
h1{font-size:1.6rem;margin:0 0 4px}h2{margin-top:28px;font-size:1.15rem}table{border-collapse:collapse;width:100%}td{border-top:1px solid #ddd;padding:8px 6px;vertical-align:top}
.note{background:#f3f6ff;border:1px solid #cfd8ff;border-radius:10px;padding:12px 14px}code{background:#eee;padding:1px 5px;border-radius:4px}</style></head><body>
<h1>HAVYN VAULT</h1><p>The family's offline library. Made by the HAVYN vault script (1.3.0+4b60c483ec); catalog checked 2026-11-14.</p>
<div class="note"><b>In an emergency:</b> the emergency cards and playbooks live in the HAVYN app on every phone and in the printed binder. This drive is the deep library behind them.</div>
<h2>What's in each folder</h2><table><tr><td><b>01-phone-set</b></td><td>Phone set</td><td>Open these on any iPhone: in HAVYN tap Add files and pick them here (Files › the drive). They also open in Kiwix.</td></tr><tr><td><b>02-encyclopedias</b></td><td>Encyclopedias</td><td>Wikipedia, Wikivoyage, the dictionary and textbooks. Open in Kiwix on a laptop or phone, or Add files in HAVYN.</td></tr><tr><td><b>03-medical</b></td><td>Medical</td><td>Medical encyclopedias and drug references. Some are website copies that need Kiwix.</td></tr><tr><td><b>04-skills-and-repair</b></td><td>Skills and repair</td><td>Ready.gov, iFixit, Appropedia and Q&amp;A archives for home, car, garden and radio.</td></tr><tr><td><b>05-video</b></td><td>Video</td><td>Video archives. Open them in Kiwix (iOS 17 or later on iPhone).</td></tr><tr><td><b>06-books</b></td><td>Books</td><td>Project Gutenberg collections.</td></tr><tr><td><b>07-ai</b></td><td>Offline AI</td><td>A single-file AI assistant for any laptop. Mac/Linux: open Terminal here and run it. Windows: rename it to end in .exe and double-click. It can be wrong: the emergency cards win.</td></tr><tr><td><b>08-software</b></td><td>Software</td><td>Installers for Kiwix, VLC, radios, maps and servers, for Windows, Mac, Linux, Android and Raspberry Pi.</td></tr><tr><td><b>09-builder</b></td><td>Builder</td><td>Programming references, if you chose everything.</td></tr></table>
<h2>Open it on an iPhone</h2><ol><li>Plug the drive in (USB-C iPhones directly; older iPhones need Apple's Lightning to USB 3 adapter).</li><li>HAVYN → Library → <b>Add files</b> → Browse → the drive → pick a file in <code>01-phone-set</code>. HAVYN keeps its own copy.</li><li>Big archives and video: open them in the <b>Kiwix</b> app instead (Files → long-press the file → Share → Kiwix).</li></ol>
<h2>Share it with every phone (home library)</h2><ul><li><b>Easiest: a laptop plus the drive</b> — Plug the vault drive into any laptop with Kiwix, open the archives, then turn on its Hotspot (Kiwix calls it that; it shares over your home Wi-Fi). Phones scan the QR code or open the address it shows in Safari. Put the laptop and the Wi-Fi router on the power station: the router keeps working without internet.</li><li><b>No laptop: one iPhone or iPad with Kiwix</b> — Kiwix for iPhone, iPad and Mac can share chosen archives the same way (Hotspot, then show the QR code). Load the big archives on the device with the most storage.</li><li><b>Always-on: Raspberry Pi 5 with an SSD</b> — A small, low-power server running kiwix-serve from the drive, on the router or its own Wi-Fi. Kiwix Hotspot supports Pi 3B through Pi 500.</li><li><b>Everything: a mini PC with Project N.O.M.A.D.</b> — Free, open-source server that adds Khan Academy courses, offline maps and a local AI assistant to Kiwix. Install and download its content while you still have internet.</li></ul>
<h2>Keep it current</h2><p>Run the same script again: it fetches newer versions, resumes unfinished downloads, re-checks checksums, and removes older copies of the same archive. Keep a second drive in sync and store one away from home.</p>
<h2>Everything the script fetches</h2><ul><li><b>WikiMed: medical encyclopedia</b> — Wikipedia&#x27;s medical articles with pictures: conditions, injuries, medicines, anatomy. The most useful single archive for a family.</li><li><b>Post-disaster library</b> — Manuals for shelter, sanitation, water and recovery after a disaster.</li><li><b>Water treatment</b> — Making water safe to drink: boiling, filters, chemicals, storage.</li><li><b>Food for preppers</b> — Food storage, preservation and safe preparation.</li><li><b>Medical library</b> — A small collection of field medical guides.</li><li><b>A library of knots</b> — How to tie the knots you need for tarps, loads and rescue.</li><li><b>Vikidia: encyclopedia for kids</b> — A children&#x27;s encyclopedia written for ages 8 to 13. Keeps kids reading and learning when screens are all they have.</li><li><b>Wikipedia: the top articles, with pictures</b> — The most-read English articles in full. Pick this if the phone has about 10 GB free; the text-only edition is 2.8 GB.</li><li><b>Wikipedia: every article, short form</b> — The opening section of all 7 million English articles. For phones with about 15 GB free.</li><li><b>US Army Survival manual (ATP 3-50.21)</b> — Water, fire, shelter, navigation, signaling and first aid. Approved for public release; distribution unlimited.</li><li><b>FEMA CERT Basic Training manual</b> — Disaster first aid, light search and rescue, fire safety and team organization, from FEMA&#x27;s community response course.</li><li><b>All of Wikipedia, with pictures</b> — Every English article and image: the whole encyclopedia.</li><li><b>All of Wikipedia, text only</b> — Every article without images. For a phone with 60 GB free, through Kiwix or HAVYN.</li><li><b>MDWiki: second medical encyclopedia</b> — Medical articles curated by WikiProject Medicine, with images.</li><li><b>MedlinePlus (US National Library of Medicine)</b> — Health topics, drugs and supplements in plain English.</li><li><b>NHS medicines A to Z</b> — What common medicines are for, doses and side effects.</li><li><b>Military medicine manuals (FAS archive)</b> — Field medical and emergency war surgery handbooks.</li><li><b>Ready.gov (FEMA)</b> — The full US government preparedness site: every hazard, kit and plan.</li><li><b>iFixit repair guides</b> — Step-by-step repairs for phones, appliances, cars and tools.</li><li><b>Appropedia</b> — Low-tech solutions: water, energy, cooking, building, sanitation.</li><li><b>Home Improvement Q&amp;A (Stack Exchange)</b> — Plumbing, electrical, HVAC and repair questions answered by tradespeople.</li><li><b>Motor Vehicle Repair Q&amp;A</b> — Car problems, diagnosis and fixes.</li><li><b>Gardening Q&amp;A</b> — Growing food, soil, pests and desert gardening.</li><li><b>Amateur Radio Q&amp;A</b> — Radios, antennas, licensing and emergency communication.</li><li><b>Cooking Q&amp;A (Seasoned Advice)</b> — Food safety, substitutions and cooking without a kitchen.</li><li><b>The Great Outdoors Q&amp;A</b> — Camping, hiking, navigation and wilderness survival.</li><li><b>Project Gutenberg: agriculture books</b> — Thousands of free classic books on farming, gardening and rural skills.</li><li><b>Project Gutenberg: technology books</b> — Classic books on engineering, building, chemistry and household skills.</li><li><b>Wikivoyage</b> — Travel guides for every town: useful when you have to leave.</li><li><b>Wiktionary: the dictionary</b> — Every English word with meanings and translations.</li><li><b>Wikibooks: free textbooks</b> — Open textbooks on every school subject, for keeping kids learning.</li><li><b>Wikipedia en español</b> — All of Spanish Wikipedia with pictures, for Spanish-speaking family and neighbors.</li><li><b>Video: quick guides for medicine</b> — Short medical explainer videos.</li><li><b>Video: Learn Self Reliance</b> — Food preservation, foraging, wood stoves and homestead skills.</li><li><b>Video: prepping food (Canadian Prepper)</b> — Long-term food storage and cooking during outages.</li><li><b>Video: TED talks on health</b> — Health and medicine talks with transcripts.</li><li><b>Video: Crash Course (school subjects)</b> — Fast, clear lessons in science, history and more for teens.</li><li><b>Offline AI assistant (llamafile, Llama 3.2 3B)</b> — One file that runs a private AI chat on any Windows, Mac or Linux laptop with no install and no internet. It can be wrong: never use it over the emergency cards.</li><li><b>Kiwix for Windows</b> — Reads every archive and shares them over Wi-Fi.</li><li><b>Kiwix for Linux (AppImage)</b> — The same reader for Linux laptops.</li><li><b>Kiwix for Mac</b> — The reader for Macs; also free on the Mac App Store.</li><li><b>kiwix-serve (server for any computer or Raspberry Pi)</b> — Turns any computer into the home library server. Builds for Windows, Mac, Linux and Raspberry Pi.</li><li><b>Kiwix for Android (APK)</b> — For any Android phone or tablet in the house.</li><li><b>VLC for Windows</b> — Plays every video format.</li><li><b>VLC for Mac</b> — Plays every video format.</li><li><b>Meshtastic radio firmware</b> — Re-flash or set up the LoRa radios with no internet.</li><li><b>Meshtastic for Android (APK)</b> — For Android phones in the group.</li><li><b>Organic Maps for Android (APK)</b> — Offline maps for Android phones.</li><li><b>KeePassXC password vault</b> — Keep account passwords in an encrypted file on the drive, readable on any computer.</li><li><b>Raspberry Pi Imager</b> — Sets up a Raspberry Pi home library server.</li><li><b>Project N.O.M.A.D. (source)</b> — Offline server bundle: Kiwix, Khan Academy, maps and local AI. Install it while online; see Home library.</li><li><b>HAVYN itself (source)</b> — The whole app, so it can be rebuilt or served from any computer.</li><li><b>Builder: Stack Overflow</b> — Every programming question and answer, for keeping your own systems running.</li><li><b>Builder: Super User</b> — Computer troubleshooting Q&amp;A.</li><li><b>Builder: Electrical Engineering Q&amp;A</b> — Circuits, batteries, solar and repair.</li><li><b>Builder: freeCodeCamp curriculum</b> — A full programming course in a few megabytes.</li></ul>
<p style="color:#666;font-size:.9rem">Archives by Kiwix (kiwix.org) and their original publishers, under their own licenses. HAVYN: github.com/hourglazlabs-x/havyn</p>
</body></html>
HAVYNHTML
fi
say ""; say "Done: $ok fetched or already here, $failed need another run. Free space: $(( $(free_mb) / 1024 )) GB."
say "Log: $LOG"
[ "$failed" -eq 0 ] || say "Run the same command again to finish the rest."
