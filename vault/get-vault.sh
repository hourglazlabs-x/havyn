#!/bin/bash
# HAVYN VAULT — fills a USB drive with the family's offline library.
# Generated from HAVYN's archive catalog (1.9.0+59757fce57).
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
p-wikimed	core	zim	01-phone-set	wikipedia	wikipedia_en_medicine_maxi	0	WikiMed: medical encyclopedia
p-postdisaster	core	zim	01-phone-set	other	zimgit-post-disaster_en	0	Post-disaster library
p-water	core	zim	01-phone-set	other	zimgit-water_en	0	Water treatment
p-food	core	zim	01-phone-set	other	zimgit-food-preparation_en	0	Food for preppers
p-medlib	core	zim	01-phone-set	other	zimgit-medicine_en	0	Medical library
p-knots	core	zim	01-phone-set	other	zimgit-knots_en	0	A library of knots
p-vikidia	core	zim	01-phone-set	vikidia	vikidia_en_all_maxi	0	Vikidia: encyclopedia for kids
p-wptop	full	zim	01-phone-set	wikipedia	wikipedia_en_top_maxi	0	Wikipedia: the top articles, with pictures
p-wpmini	full	zim	01-phone-set	wikipedia	wikipedia_en_all_mini	0	Wikipedia: every article, short form
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
# ---- reference shelf: manuals and guides, checked by HAVYN's shelf workflow ----
SHELF_URL="${HAVYN_SHELF_TSV:-https://github.com/hourglazlabs-x/havyn/releases/download/shelf/shelf-files.tsv}"
STSV="$ROOT/logs/shelf-files.tsv"
say ""
if curl -fsSL -A "$UA" --connect-timeout 30 -o "$STSV.new" "$SHELF_URL" 2>/dev/null && [ -s "$STSV.new" ] && grep -q "$TAB" "$STSV.new"; then
  mv "$STSV.new" "$STSV"; say "Reference shelf (checked list from GitHub)"
else
  rm -f "$STSV.new"; cat > "$STSV" <<'SHELF'
sh-firstaid	core	10-shelf/01-medicine-and-first-aid	ATP-4-02.11-First-Aid-2026.pdf	https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN46159-ATP_4-02.11-000-WEB-1.pdf	-	12665561	Army First Aid manual (ATP 4-02.11)
sh-shipmed	core	10-shelf/01-medicine-and-first-aid	Ships-Medicine-Chest-and-Medical-Aid-at-Sea-2003.pdf	https://irp.fas.org/doddir/milmed/ships.pdf	-	3588808	The Ship's Medicine Chest and Medical Aid at Sea
sh-bec	core	10-shelf/01-medicine-and-first-aid	WHO-ICRC-Basic-Emergency-Care-2018.pdf	https://iris.who.int/bitstream/handle/10665/275635/9789241513081-eng.pdf	-	4254742	Basic Emergency Care: the acutely ill and injured
sh-msf	core	10-shelf/01-medicine-and-first-aid	MSF-Clinical-Guidelines.pdf	https://medicalguidelines.msf.org/sites/default/files/pdf/guideline-170-en.pdf	-	9000000	MSF Clinical Guidelines: diagnosis and treatment
sh-foodwater	core	10-shelf/02-water	FEMA-Food-and-Water-in-an-Emergency.pdf	https://www.fema.gov/pdf/library/f&web.pdf	-	602820	Food and Water in an Emergency
sh-epawater	core	10-shelf/02-water	EPA-Emergency-Disinfection-of-Drinking-Water.pdf	https://www.epa.gov/sites/default/files/2017-09/documents/emergency_disinfection_of_drinking_water_sept2017.pdf	-	754723	Emergency Disinfection of Drinking Water
sh-tbmed577	core	10-shelf/02-water	TB-MED-577-Field-Water-Supplies-2010.pdf	https://www.med.navy.mil/Portals/62/Documents/BUMED/Directives/All%20Pubs/5010-10.pdf	-	1890594	Field Water Supplies (TB MED 577)
sh-gdwq	full	10-shelf/02-water	WHO-Guidelines-Drinking-water-Quality-2022.pdf	https://iris.who.int/bitstream/handle/10665/352532/9789240045064-eng.pdf	-	5321705	Guidelines for Drinking-water Quality
sh-fieldsan	core	10-shelf/03-sanitation-and-hygiene	FM-4-25.12-Field-Sanitation-2002.pdf	https://webarchive.library.unt.edu/web/20121027044100id_/http://www.irwin.amedd.army.mil/pages/NTCsurgeon/Preventive%20Medicine/fm4_25x12.pdf	-	2309124	Unit Field Sanitation Team (FM 4-25.12)
sh-canning	core	10-shelf/04-food	USDA-Complete-Guide-to-Home-Canning-2015.pdf	https://www.growables.com/information/documents/CanningUSDA.pdf	-	17320124	USDA Complete Guide to Home Canning
sh-azveg	core	10-shelf/04-food	UA-AZ1005-Maricopa-Vegetable-Planting-Calendar.pdf	https://extension.arizona.edu/sites/extension.arizona.edu/files/pubs/az1005-2018.pdf	-	649830	Vegetable Planting Calendar for Maricopa County
sh-az10	full	10-shelf/04-food	UA-AZ1435-Ten-Steps-Vegetable-Garden.pdf	https://extension.arizona.edu/sites/extension.arizona.edu/files/pubs/az1435-2015.pdf	-	1613848	Ten Steps to a Successful Vegetable Garden
sh-carpentry	core	10-shelf/05-shelter-and-building	FM-5-426-Carpentry-1995.pdf	https://archive.org/download/MManuals/UsArmyEngineerCarpentry1995.pdf	-	4520854	Carpentry (FM 5-426)
sh-concrete	core	10-shelf/05-shelter-and-building	FM-5-428-Concrete-and-Masonry-1998.pdf	https://vulcanhammer.net/wp-content/uploads/2017/01/fm5_428.pdf	-	4512330	Concrete and Masonry (FM 5-428)
sh-builder	full	10-shelf/05-shelter-and-building	NAVEDTRA-14043-Builder-Vol1-1993.pdf	https://www.constructionknowledge.net/public_domain_documents/Builder_and_2_vol_1_NAVEDTRA_14043_1993.pdf	-	9922566	Builder 3 & 2, Volume 1 (NAVEDTRA 14043)
sh-woodhb	full	10-shelf/05-shelter-and-building	USDA-Wood-Handbook-2021.pdf	https://research.fs.usda.gov/download/treesearch/62200.pdf	-	103951597	Wood Handbook: wood as an engineering material
sh-cpscgen	core	10-shelf/06-power-and-electricity	CPSC-Portable-Generator-Hazards.pdf	https://www.cpsc.gov/s3fs-public/5123_SafetyAlert_PortableGenerators_102021.pdf	-	111498	Portable Generator Hazards
sh-oshagen	full	10-shelf/06-power-and-electricity	OSHA-3286-Portable-Generators.pdf	https://www.osha.gov/sites/default/files/publications/OSHA3286.pdf	-	520196	Using Portable Generators Safely
sh-power	core	10-shelf/06-power-and-electricity	ATP-3-34.45-Electric-Power-2024.pdf	https://irp.fas.org/doddir/army/atp3-34-45.pdf	-	10000000	Electric Power Generation and Distribution (ATP 3-34.45)
sh-solar	core	10-shelf/06-power-and-electricity	DOE-Own-Your-Power-Solar-Guide.pdf	https://www1.eere.energy.gov/solar/pdfs/43844.pdf	-	3592781	Own Your Power! Solar electricity for the home
sh-wind	full	10-shelf/06-power-and-electricity	DOE-Small-Wind-Electric-Systems-2007.pdf	https://www.nlr.gov/docs/fy07osti/42005.pdf	-	1323194	Small Wind Electric Systems: a U.S. consumer's guide
sh-liec1	core	10-shelf/06-power-and-electricity	Lessons-in-Electric-Circuits-1-DC.pdf	https://ibiblio.org/kuphaldt/electricCircuits/DC/DC.pdf	-	4504703	Lessons in Electric Circuits, Vol. I: DC
sh-liec2	core	10-shelf/06-power-and-electricity	Lessons-in-Electric-Circuits-2-AC.pdf	https://ibiblio.org/kuphaldt/electricCircuits/AC/AC.pdf	-	4554561	Lessons in Electric Circuits, Vol. II: AC
sh-liec3	full	10-shelf/06-power-and-electricity	Lessons-in-Electric-Circuits-3-Semiconductors.pdf	https://ibiblio.org/kuphaldt/electricCircuits/Semi/SEMI.pdf	-	4189478	Lessons in Electric Circuits, Vol. III: Semiconductors
sh-liec4	full	10-shelf/06-power-and-electricity	Lessons-in-Electric-Circuits-4-Digital.pdf	https://ibiblio.org/kuphaldt/electricCircuits/Digital/DIGI.pdf	-	3664633	Lessons in Electric Circuits, Vol. IV: Digital
sh-liec5	full	10-shelf/06-power-and-electricity	Lessons-in-Electric-Circuits-5-Reference.pdf	https://ibiblio.org/kuphaldt/electricCircuits/Ref/REF.pdf	-	1056675	Lessons in Electric Circuits, Vol. V: Reference
sh-liec6	full	10-shelf/06-power-and-electricity	Lessons-in-Electric-Circuits-6-Experiments.pdf	https://ibiblio.org/kuphaldt/electricCircuits/Exper/EXP.pdf	-	4024856	Lessons in Electric Circuits, Vol. VI: Experiments
sh-nifog	core	10-shelf/07-communications	CISA-NIFOG-2.02.pdf	https://www.cisa.gov/sites/default/files/2024-12/NIFOG%202.02_508%20FINAL%20VERSION%2012%2003%202024.pdf	-	6735362	National Interoperability Field Operations Guide (NIFOG 2.02)
sh-auxfog	core	10-shelf/07-communications	DHS-AUXFOG-1.1.pdf	https://www.cisa.gov/sites/default/files/publications/AUXFOG%20June%202016%20-%20508%20Reviewed%20-%20Final%20(2-16-17).pdf	-	3427518	Auxiliary Communications Field Operations Guide (AUXFOG 1.1)
sh-tools	core	10-shelf/08-tools-machines-and-trades	NAVEDTRA-14256-Tools-and-Their-Uses-1992.pdf	https://www.constructionknowledge.net/public_domain_documents/Div_1_General/Basic_Skills/Tools%20&%20their%20Uses%20NAVEDTRA%2014256.pdf	-	19197978	Tools and Their Uses (NAVEDTRA 14256)
sh-machines	core	10-shelf/08-tools-machines-and-trades	NAVEDTRA-14037-Basic-Machines-1994.pdf	https://dieselduck.ca/machine/04%20auxiliary/1994%20USN%20Basic%20Machines.pdf	-	8552129	Basic Machines (NAVEDTRA 14037)
sh-blueprint	full	10-shelf/08-tools-machines-and-trades	NAVEDTRA-12014-Blueprint-Reading-1994.pdf	https://archive.org/download/MManuals/UsNavyBlueprintReadingSketching1994.pdf	-	5823767	Blueprint Reading and Sketching (NAVEDTRA 12014)
sh-machinetools	full	10-shelf/08-tools-machines-and-trades	TC-9-524-Machine-Tools-1996.pdf	https://archive.org/download/MManuals/UsArmyMachinistFundamentals-machineTools1996.pdf	-	7211870	Fundamentals of Machine Tools (TC 9-524)
sh-electrician	core	10-shelf/08-tools-machines-and-trades	NAVEDTRA-14026-Construction-Electrician-1998.pdf	https://media.defense.gov/2014/Jun/20/2002655885/-1/-1/1/140620-N-ZZ182-6530.pdf	-	5341145	Construction Electrician Basic (NAVEDTRA 14026)
sh-autos	core	10-shelf/08-tools-machines-and-trades	TM-9-8000-Principles-of-Automotive-Vehicles.pdf	https://everyspec.com/ARMY/TM-Tech-Manual/download.php?spec=TM_9-8000_CHG-1.048512.pdf	-	17491715	Principles of Automotive Vehicles (TM 9-8000)
sh-ayr	core	10-shelf/09-emergency-response-and-survival	FEMA-Are-You-Ready-IS-22.pdf	https://bready.sd.gov/bReady/areyouready_full.pdf	-	22098772	Are You Ready? An in-depth guide to citizen preparedness
sh-cert	core	10-shelf/09-emergency-response-and-survival	FEMA-CERT-Basic-Training-Participant-Manual-2019.pdf	https://www.ready.gov/sites/default/files/2019.CERT_.Basic_.PM_FINAL_508c.pdf	-	5509166	CERT Basic Training manual
sh-survival	core	10-shelf/09-emergency-response-and-survival	ATP-3-50.21-Survival-2018.pdf	https://irp.fas.org/doddir/army/atp3-50-21.pdf	-	23749774	Survival (ATP 3-50.21)
sh-landnav	core	10-shelf/09-emergency-response-and-survival	FM-3-25.26-Map-Reading-Land-Navigation-2001.pdf	https://archive.org/download/MManuals/Fm3-25.26MapReadingAndLandNavigation.pdf	-	23583528	Map Reading and Land Navigation (FM 3-25.26)
sh-erg	core	10-shelf/09-emergency-response-and-survival	DOT-Emergency-Response-Guidebook-2024.pdf	https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/2024-04/ERG2024-Eng-Web-a.pdf	-	10000000	Emergency Response Guidebook 2024
sh-pfa	core	10-shelf/10-family-kids-and-mind	NCTSN-Psychological-First-Aid-Field-Operations-Guide.pdf	https://www.nctsn.org/sites/default/files/resources/pfa_field_operations_guide.pdf	-	3439195	Psychological First Aid: field operations guide
sh-wrigleyheat	full	10-shelf/10-family-kids-and-mind	CDC-Ready-Wrigley-Extreme-Heat.pdf	https://stacks.cdc.gov/view/cdc/37673/cdc_37673_DS1.pdf	-	2100161	Ready Wrigley Prepares for Extreme Heat
sh-wrigleycope	full	10-shelf/10-family-kids-and-mind	CDC-Ready-Wrigley-Coping-After-a-Disaster.pdf	https://stacks.cdc.gov/view/cdc/58346/cdc_58346_DS1.pdf	-	1974241	Ready Wrigley: Coping After a Disaster
sh-wrigleyfire	full	10-shelf/10-family-kids-and-mind	CDC-Ready-Wrigley-Wildfires-Smoke.pdf	https://stacks.cdc.gov/view/cdc/118266/cdc_118266_DS1.pdf	-	5027373	Ready Wrigley Prepares for Wildfires and Smoke
sh-topo	core	10-shelf/12-maps-and-reference	USGS-Topographic-Map-Symbols.pdf	https://pubs.usgs.gov/gip/TopographicMapSymbols/topomapsymbols.pdf	-	2197818	Topographic Map Symbols
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
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HAVYN VAULT — start here</title>
<style>body{font:16px/1.5 -apple-system,system-ui,Segoe UI,sans-serif;margin:0;padding:24px;max-width:860px;color:#111;background:#fff}
h1{font-size:1.6rem;margin:0 0 4px}h2{margin-top:28px;font-size:1.15rem}table{border-collapse:collapse;width:100%}td{border-top:1px solid #ddd;padding:8px 6px;vertical-align:top}
.note{background:#f3f6ff;border:1px solid #cfd8ff;border-radius:10px;padding:12px 14px}code{background:#eee;padding:1px 5px;border-radius:4px}</style></head><body>
<h1>HAVYN VAULT</h1><p>The family's offline library. Made by the HAVYN vault script (1.9.0+59757fce57); catalog checked 2026-11-14.</p>
<div class="note"><b>In an emergency:</b> the emergency cards and playbooks live in the HAVYN app on every phone and in the printed binder. This drive is the deep library behind them.</div>
<h2>What's in each folder</h2><table><tr><td><b>01-phone-set</b></td><td>Phone set</td><td>Open these on any iPhone: in HAVYN tap Add files and pick them here (Files › the drive). They also open in Kiwix.</td></tr><tr><td><b>02-encyclopedias</b></td><td>Encyclopedias</td><td>Wikipedia, Wikivoyage, the dictionary and textbooks. Open in Kiwix on a laptop or phone, or Add files in HAVYN.</td></tr><tr><td><b>03-medical</b></td><td>Medical</td><td>Medical encyclopedias and drug references. Some are website copies that need Kiwix.</td></tr><tr><td><b>04-skills-and-repair</b></td><td>Skills and repair</td><td>Ready.gov, iFixit, Appropedia and Q&amp;A archives for home, car, garden and radio.</td></tr><tr><td><b>05-video</b></td><td>Video</td><td>Video archives. Open them in Kiwix (iOS 17 or later on iPhone).</td></tr><tr><td><b>06-books</b></td><td>Books</td><td>Project Gutenberg collections.</td></tr><tr><td><b>07-ai</b></td><td>Offline AI</td><td>A single-file AI assistant for any laptop. Mac/Linux: open Terminal here and run it. Windows: rename it to end in .exe and double-click. It can be wrong: the emergency cards win.</td></tr><tr><td><b>08-software</b></td><td>Software</td><td>Installers for Kiwix, VLC, radios, maps and servers, for Windows, Mac, Linux, Android and Raspberry Pi.</td></tr><tr><td><b>09-builder</b></td><td>Builder</td><td>Programming references, if you chose everything.</td></tr><tr><td><b>10-shelf</b></td><td>Reference shelf</td><td>Real manuals and guides by system: medicine, water, sanitation, food, building, power, radio, tools, response, family, science and maps. Open them in HAVYN (Library › Add files) or any PDF reader. Hesperian books come as chapter folders: in HAVYN, select every chapter at once and it joins them into one book.</td></tr></table>
<h2>Open it on an iPhone</h2><ol><li>Plug the drive in (USB-C iPhones directly; older iPhones need Apple's Lightning to USB 3 adapter).</li><li>HAVYN → Library → <b>Add files</b> → Browse → the drive → pick a file in <code>01-phone-set</code>. HAVYN keeps its own copy.</li><li>Big archives and video: open them in the <b>Kiwix</b> app instead (Files → long-press the file → Share → Kiwix).</li></ol>
<h2>Share it with every phone (home library)</h2><ul><li><b>Easiest: a laptop plus the drive</b> — Plug the vault drive into any laptop with Kiwix, open the archives, then turn on its Hotspot (Kiwix calls it that; it shares over your home Wi-Fi). Phones scan the QR code or open the address it shows in Safari. Put the laptop and the Wi-Fi router on the power station: the router keeps working without internet.</li><li><b>No laptop: one iPhone or iPad with Kiwix</b> — Kiwix for iPhone, iPad and Mac can share chosen archives the same way (Hotspot, then show the QR code). Load the big archives on the device with the most storage.</li><li><b>Always-on: Raspberry Pi 5 with an SSD</b> — A small, low-power server running kiwix-serve from the drive, on the router or its own Wi-Fi. Kiwix Hotspot supports Pi 3B through Pi 500.</li><li><b>Everything: a mini PC with Project N.O.M.A.D.</b> — Free, open-source server that adds Khan Academy courses, offline maps and a local AI assistant to Kiwix. Install and download its content while you still have internet.</li></ul>
<h2>Keep it current</h2><p>Run the same script again: it fetches newer versions, resumes unfinished downloads, re-checks checksums, and removes older copies of the same archive. Keep a second drive in sync and store one away from home.</p>
<h2>Everything the script fetches</h2><ul><li><b>WikiMed: medical encyclopedia</b> — Wikipedia&#x27;s medical articles with pictures: conditions, injuries, medicines, anatomy. The most useful single archive for a family.</li><li><b>Post-disaster library</b> — Manuals for shelter, sanitation, water and recovery after a disaster.</li><li><b>Water treatment</b> — Making water safe to drink: boiling, filters, chemicals, storage.</li><li><b>Food for preppers</b> — Food storage, preservation and safe preparation.</li><li><b>Medical library</b> — A small collection of field medical guides.</li><li><b>A library of knots</b> — How to tie the knots you need for tarps, loads and rescue.</li><li><b>Vikidia: encyclopedia for kids</b> — A children&#x27;s encyclopedia written for ages 8 to 13. Keeps kids reading and learning when screens are all they have.</li><li><b>Wikipedia: the top articles, with pictures</b> — The most-read English articles in full. Pick this if the phone has about 10 GB free; the text-only edition is 2.8 GB.</li><li><b>Wikipedia: every article, short form</b> — The opening section of all 7 million English articles. For phones with about 15 GB free.</li><li><b>All of Wikipedia, with pictures</b> — Every English article and image: the whole encyclopedia.</li><li><b>All of Wikipedia, text only</b> — Every article without images. For a phone with 60 GB free, through Kiwix or HAVYN.</li><li><b>MDWiki: second medical encyclopedia</b> — Medical articles curated by WikiProject Medicine, with images.</li><li><b>MedlinePlus (US National Library of Medicine)</b> — Health topics, drugs and supplements in plain English.</li><li><b>NHS medicines A to Z</b> — What common medicines are for, doses and side effects.</li><li><b>Military medicine manuals (FAS archive)</b> — Field medical and emergency war surgery handbooks.</li><li><b>Ready.gov (FEMA)</b> — The full US government preparedness site: every hazard, kit and plan.</li><li><b>iFixit repair guides</b> — Step-by-step repairs for phones, appliances, cars and tools.</li><li><b>Appropedia</b> — Low-tech solutions: water, energy, cooking, building, sanitation.</li><li><b>Home Improvement Q&amp;A (Stack Exchange)</b> — Plumbing, electrical, HVAC and repair questions answered by tradespeople.</li><li><b>Motor Vehicle Repair Q&amp;A</b> — Car problems, diagnosis and fixes.</li><li><b>Gardening Q&amp;A</b> — Growing food, soil, pests and desert gardening.</li><li><b>Amateur Radio Q&amp;A</b> — Radios, antennas, licensing and emergency communication.</li><li><b>Cooking Q&amp;A (Seasoned Advice)</b> — Food safety, substitutions and cooking without a kitchen.</li><li><b>The Great Outdoors Q&amp;A</b> — Camping, hiking, navigation and wilderness survival.</li><li><b>Project Gutenberg: agriculture books</b> — Thousands of free classic books on farming, gardening and rural skills.</li><li><b>Project Gutenberg: technology books</b> — Classic books on engineering, building, chemistry and household skills.</li><li><b>Wikivoyage</b> — Travel guides for every town: useful when you have to leave.</li><li><b>Wiktionary: the dictionary</b> — Every English word with meanings and translations.</li><li><b>Wikibooks: free textbooks</b> — Open textbooks on every school subject, for keeping kids learning.</li><li><b>Wikipedia en español</b> — All of Spanish Wikipedia with pictures, for Spanish-speaking family and neighbors.</li><li><b>Video: quick guides for medicine</b> — Short medical explainer videos.</li><li><b>Video: Learn Self Reliance</b> — Food preservation, foraging, wood stoves and homestead skills.</li><li><b>Video: prepping food (Canadian Prepper)</b> — Long-term food storage and cooking during outages.</li><li><b>Video: TED talks on health</b> — Health and medicine talks with transcripts.</li><li><b>Video: Crash Course (school subjects)</b> — Fast, clear lessons in science, history and more for teens.</li><li><b>Offline AI assistant (llamafile, Llama 3.2 3B)</b> — One file that runs a private AI chat on any Windows, Mac or Linux laptop with no install and no internet. It can be wrong: never use it over the emergency cards.</li><li><b>Kiwix for Windows</b> — Reads every archive and shares them over Wi-Fi.</li><li><b>Kiwix for Linux (AppImage)</b> — The same reader for Linux laptops.</li><li><b>Kiwix for Mac</b> — The reader for Macs; also free on the Mac App Store.</li><li><b>kiwix-serve (server for any computer or Raspberry Pi)</b> — Turns any computer into the home library server. Builds for Windows, Mac, Linux and Raspberry Pi.</li><li><b>Kiwix for Android (APK)</b> — For any Android phone or tablet in the house.</li><li><b>VLC for Windows</b> — Plays every video format.</li><li><b>VLC for Mac</b> — Plays every video format.</li><li><b>Meshtastic radio firmware</b> — Re-flash or set up the LoRa radios with no internet.</li><li><b>Meshtastic for Android (APK)</b> — For Android phones in the group.</li><li><b>Organic Maps for Android (APK)</b> — Offline maps for Android phones.</li><li><b>KeePassXC password vault</b> — Keep account passwords in an encrypted file on the drive, readable on any computer.</li><li><b>Raspberry Pi Imager</b> — Sets up a Raspberry Pi home library server.</li><li><b>Project N.O.M.A.D. (source)</b> — Offline server bundle: Kiwix, Khan Academy, maps and local AI. Install it while online; see Home library.</li><li><b>HAVYN itself (source)</b> — The whole app, so it can be rebuilt or served from any computer.</li><li><b>Builder: Stack Overflow</b> — Every programming question and answer, for keeping your own systems running.</li><li><b>Builder: Super User</b> — Computer troubleshooting Q&amp;A.</li><li><b>Builder: Electrical Engineering Q&amp;A</b> — Circuits, batteries, solar and repair.</li><li><b>Builder: freeCodeCamp curriculum</b> — A full programming course in a few megabytes.</li><li><b>Army First Aid manual (ATP 4-02.11)</b> (US Army Medical Center of Excellence) — Stopping bleeding, airway and breathing, shock, burns, broken bones and moving the injured, for people who aren&#x27;t medics. The Army&#x27;s current first-aid manual, published March 2026.</li><li><b>The Ship&#x27;s Medicine Chest and Medical Aid at Sea</b> (US Public Health Service) — Written for a crew with no doctor on board: examining a patient, injuries, illness, medicines, and when to call for evacuation. A close match for a family cut off from care.</li><li><b>Basic Emergency Care: the acutely ill and injured</b> (World Health Organization and ICRC) — The ABCDE method for someone suddenly very sick or hurt: trauma, trouble breathing, shock and confusion, with step-by-step skill sheets. WHO&#x27;s course for first-contact health workers.</li><li><b>Where There Is No Doctor</b> (Hesperian Health Guides) — The world&#x27;s most-used village health handbook: what&#x27;s wrong, what to do, which medicine and when to get help. Hesperian lets families download it free but not re-host it, so it comes from Hesperian in chapters and HAVYN joins them into one book when you add them together.</li><li><b>Where There Is No Dentist</b> (Hesperian Health Guides) — Toothache, abscesses, broken teeth and safe extraction when no dentist can be reached, and keeping teeth healthy. In chapters from Hesperian, like Where There Is No Doctor.</li><li><b>Where Women Have No Doctor</b> (Hesperian Health Guides) — Women&#x27;s health from puberty to old age, including pregnancy, birth problems and infections, for when there&#x27;s no clinic.</li><li><b>MSF Clinical Guidelines: diagnosis and treatment</b> (Médecins Sans Frontières) — The manual MSF clinicians use far from hospitals: symptoms, infections, wounds, burns, bites and minor procedures, with drug doses. Written for medical staff; read it with a nurse or medic if you can.</li><li><b>Clinical Nursing Skills</b> (OpenStax, Rice University) — The hands-on work of nursing, step by step: vital signs, wound and burn care, giving medicines and injections, IV lines, catheters, infection control and moving patients safely.</li><li><b>Pharmacology for Nurses</b> (OpenStax, Rice University) — What each common kind of medicine does, its side effects and dangerous combinations, and how to give it safely, body system by body system.</li><li><b>Maternal-Newborn Nursing</b> (OpenStax, Rice University) — Pregnancy, labor and birth, what can go wrong, the weeks after, breastfeeding and newborn care: for when a baby comes and the hospital can&#x27;t be reached.</li><li><b>Food and Water in an Emergency</b> (FEMA and American Red Cross) — How much water to store and how, hidden water already in your home, treating water, and safe emergency food and cooking.</li><li><b>Emergency Disinfection of Drinking Water</b> (US Environmental Protection Agency) — Boiling, and the bleach dose for each amount of water, on two pages.</li><li><b>Field Water Supplies (TB MED 577)</b> (US Army, Navy and Air Force) — Finding, testing, treating and storing water for a group for weeks: chlorination, testing, and cleaning containers and tanks.</li><li><b>Guidelines for Drinking-water Quality</b> (World Health Organization) — The world reference on safe drinking water: germs, chemicals, treatment methods and water safety plans. For whoever ends up running a neighborhood supply.</li><li><b>Unit Field Sanitation Team (FM 4-25.12)</b> (US Army) — Keeping a group from getting sick when the plumbing fails: latrines, handwashing stations, garbage, food safety, flies and mosquitoes, heat and cold injuries.</li><li><b>USDA Complete Guide to Home Canning</b> (US Department of Agriculture) — Tested, safe ways to can fruit, tomatoes, vegetables, meat, pickles and jam, including when only a pressure canner is safe.</li><li><b>Vegetable Planting Calendar for Maricopa County</b> (University of Arizona Cooperative Extension) — What to plant each month in the Phoenix low desert, and how long until harvest.</li><li><b>Ten Steps to a Successful Vegetable Garden</b> (University of Arizona Cooperative Extension) — Starting a vegetable garden in Arizona: site, soil, water, planting and pests.</li><li><b>Carpentry (FM 5-426)</b> (US Army) — Framing, floors, walls, roofs, doors and windows, and concrete forms: a full course in wood-frame building.</li><li><b>Concrete and Masonry (FM 5-428)</b> (US Army) — Mixing, placing and curing concrete; block, brick and stone walls; footings and repairs.</li><li><b>Builder 3 &amp; 2, Volume 1 (NAVEDTRA 14043)</b> (US Navy) — The Navy Seabees&#x27; builder course: drawings and plans, woodworking, concrete, masonry and rigging.</li><li><b>Wood Handbook: wood as an engineering material</b> (USDA Forest Products Laboratory) — How strong each kind of wood is, drying, fasteners, glues, decay and fire: the engineering reference for building with wood.</li><li><b>Portable Generator Hazards</b> (US Consumer Product Safety Commission) — Carbon monoxide, shock and fire: where a generator may and may not run, from the safety regulator.</li><li><b>Using Portable Generators Safely</b> (US Occupational Safety and Health Administration) — Shock, grounding, cords, refueling, and connecting to a building only through a transfer switch.</li><li><b>Electric Power Generation and Distribution (ATP 3-34.45)</b> (US Army) — Running generators for a camp: load planning, grounding, distribution, cables and safety. The closest manual there is to running a small local grid.</li><li><b>Own Your Power! Solar electricity for the home</b> (US Department of Energy) — How home solar works, sizing a system, batteries for off-grid homes, and what to ask an installer.</li><li><b>Small Wind Electric Systems: a U.S. consumer&#x27;s guide</b> (US Department of Energy) — Whether wind power can work where you live, sizing a turbine, towers, batteries and off-grid hybrids.</li><li><b>Lessons in Electric Circuits, Vol. I: DC</b> (Tony R. Kuphaldt) — Voltage, current, resistance, Ohm&#x27;s law, series and parallel circuits, batteries and meters, from scratch.</li><li><b>Lessons in Electric Circuits, Vol. II: AC</b> (Tony R. Kuphaldt) — Household AC power, transformers, motors, power factor and three-phase systems.</li><li><b>Lessons in Electric Circuits, Vol. III: Semiconductors</b> (Tony R. Kuphaldt) — Diodes, transistors, power supplies and the electronics inside chargers and inverters.</li><li><b>Lessons in Electric Circuits, Vol. IV: Digital</b> (Tony R. Kuphaldt) — Logic, relays, counters and the basics of digital circuits.</li><li><b>Lessons in Electric Circuits, Vol. V: Reference</b> (Tony R. Kuphaldt) — Formulas, wire tables, color codes and conversions.</li><li><b>Lessons in Electric Circuits, Vol. VI: Experiments</b> (Tony R. Kuphaldt) — Hands-on projects with batteries and parts, to learn by building.</li><li><b>Navy Electricity course, Module 1: matter, energy and DC</b> (US Navy) — The Navy&#x27;s electricity and electronics course (NEETS), module 1: electricity from first principles, batteries and DC circuits.</li><li><b>Navy Electricity course, Module 2: AC and transformers</b> (US Navy) — Alternating current, inductance, capacitance and transformers.</li><li><b>Navy Electricity course, Module 3: protection, control and measurement</b> (US Navy) — Fuses, breakers, switches, relays and meters.</li><li><b>Navy Electricity course, Module 4: wiring and schematics</b> (US Navy) — Conductors, splices, soldering, wiring techniques and reading schematics.</li><li><b>Navy Electricity course, Module 5: generators and motors</b> (US Navy) — How generators and electric motors work, and how to keep them running.</li><li><b>National Interoperability Field Operations Guide (NIFOG 2.02)</b> (US Cybersecurity and Infrastructure Security Agency) — The national pocket guide to emergency radio channels and frequencies, with radio reference tables.</li><li><b>Auxiliary Communications Field Operations Guide (AUXFOG 1.1)</b> (US Department of Homeland Security) — The volunteer and amateur radio companion to the NIFOG: supporting emergency communications, nets and frequency charts.</li><li><b>Navy Electricity course, Module 10: radio waves and antennas</b> (US Navy) — How radio waves travel, transmission lines and antennas: what to know to build or fix one.</li><li><b>Navy Electricity course, Module 17: radio communications</b> (US Navy) — Transmitters, receivers and radio systems explained.</li><li><b>Tools and Their Uses (NAVEDTRA 14256)</b> (US Navy) — Every common hand and power tool: what it&#x27;s for, how to use it safely and how to care for it. Start here.</li><li><b>Basic Machines (NAVEDTRA 14037)</b> (US Navy) — Levers, pulleys, gears, hydraulics and engines from first principles: the physics behind every machine you might fix or build.</li><li><b>Blueprint Reading and Sketching (NAVEDTRA 12014)</b> (US Navy) — Reading and drawing plans for machines, piping, wiring and buildings.</li><li><b>Fundamentals of Machine Tools (TC 9-524)</b> (US Army) — Drills, lathes, mills and grinders: how a machine shop makes and repairs metal parts, with charts and formulas.</li><li><b>Construction Electrician Basic (NAVEDTRA 14026)</b> (US Navy) — Power distribution, building wiring, lighting, motors, generators and test equipment, from the Seabees&#x27; electrician course.</li><li><b>Principles of Automotive Vehicles (TM 9-8000)</b> (US Army) — How engines, fuel, ignition, cooling, charging, brakes, steering and drivetrains work and why they fail: the background to keeping any car, truck or generator engine running.</li><li><b>Are You Ready? An in-depth guide to citizen preparedness</b> (FEMA) — FEMA&#x27;s most complete household guide: plans, kits, shutting off utilities, every natural hazard, sheltering and recovery.</li><li><b>CERT Basic Training manual</b> (FEMA) — Disaster first aid, light search and rescue, fire safety and team organization, from FEMA&#x27;s community response course.</li><li><b>Survival (ATP 3-50.21)</b> (US Army) — Water, fire, shelter, food, navigation and signaling when you&#x27;re on your own, plus field first aid.</li><li><b>Map Reading and Land Navigation (FM 3-25.26)</b> (US Army) — Finding your way with a paper map and compass when GPS and phones fail: grid references, elevation, bearings and night navigation.</li><li><b>Emergency Response Guidebook 2024</b> (US Department of Transportation (PHMSA)) — If a truck or train spills chemicals nearby: look up the number on the placard to see the danger and how far away to stay.</li><li><b>Psychological First Aid: field operations guide</b> (National Child Traumatic Stress Network and National Center for PTSD) — How to calm, comfort and practically help children and adults in the hours and days after a disaster, with handouts. Written for anyone helping, not just counselors.</li><li><b>Ready Wrigley Prepares for Extreme Heat</b> (US Centers for Disease Control and Prevention) — Activity book for young kids: heat safety, the family plan and the emergency kit, with games.</li><li><b>Ready Wrigley: Coping After a Disaster</b> (US Centers for Disease Control and Prevention) — Helps young children name their feelings and find ways to cope after something scary happens.</li><li><b>Ready Wrigley Prepares for Wildfires and Smoke</b> (US Centers for Disease Control and Prevention) — Smoke, a clean room, practicing evacuation and a backpack emergency card, for kids.</li><li><b>Prealgebra (2nd edition)</b> (OpenStax, Rice University) — Arithmetic, fractions, percents and first algebra, for teaching kids or brushing up.</li><li><b>College Algebra (2nd edition)</b> (OpenStax, Rice University) — Equations, functions, graphs and the math behind engineering and planning.</li><li><b>Introductory Statistics (2nd edition)</b> (OpenStax, Rice University) — Making sense of numbers: averages, probability and sampling.</li><li><b>Chemistry (2nd edition)</b> (OpenStax, Rice University) — A full general chemistry course: matter, reactions, solutions, acids and bases.</li><li><b>College Physics (2nd edition)</b> (OpenStax, Rice University) — Forces, energy, heat, electricity, light and sound: the physics of how things work.</li><li><b>Biology (2nd edition)</b> (OpenStax, Rice University) — Cells, genetics, plants, animals and ecology.</li><li><b>Anatomy and Physiology (2nd edition)</b> (OpenStax, Rice University) — How the human body is built and works, system by system: the background to every medical guide on this shelf.</li><li><b>Microbiology</b> (OpenStax, Rice University) — Bacteria, viruses, infection and immunity: why boiling, bleach and handwashing work.</li><li><b>Topographic Map Symbols</b> (US Geological Survey) — What every line, color and symbol on a USGS topographic map means. Pair it with the land navigation manual.</li></ul>
<p style="color:#666;font-size:.9rem">Archives by Kiwix (kiwix.org) and their original publishers, under their own licenses. HAVYN: github.com/hourglazlabs-x/havyn</p>
</body></html>
HAVYNHTML
fi
say ""; say "Done: $ok fetched or already here, $failed need another run. Free space: $(( $(free_mb) / 1024 )) GB."
say "Log: $LOG"
[ "$failed" -eq 0 ] || say "Run the same command again to finish the rest."
