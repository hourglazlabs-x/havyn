/* HAVYN FIELD: SIM LAB. Train by doing: tap, listen, decide, in about a minute each.
   Nothing here is new medical advice: every answer restates an emergency card, a playbook or the source listed with it.
   art: original line drawings (viewBox 0 0 240 160), drawn with the classes in styles.css (.art .l line, .t thin,
   .k thick, .kk snake body, .f soft fill, .ff solid fill; colours .tn tan, .br brown, .am amber, .rd red, .gr green). */
const HAVYN_SIMS = {
  checked: "2026-11-15",
  art: {
    scorpBark: '<g class="l tn"><ellipse cx="92" cy="104" rx="11" ry="8"/><ellipse cx="131" cy="104" rx="30" ry="8"/><path class="t" d="M114 97v14M124 96v16M134 96v16M144 97v14"/><path d="M160 102C182 96 198 76 194 56C190 38 170 30 156 40"/><path class="t" d="M178 93l4 6M191 77l6 2M195 60h6M184 41l4-4"/><circle cx="152" cy="45" r="5"/><path d="M148 49q-6 5-3 11"/><path d="M83 100L63 86H44M44 86L23 81M44 86L25 92M83 108L63 122H44M44 122L23 117M44 122L25 128"/><path class="t" d="M100 111l-8 14-7 4M110 112l-4 16-6 4M121 112l1 16-5 5M132 112l5 15-2 6M100 97l-7-13-7-3M110 96l-3-15-6-3M121 96l2-15-4-4M132 96l6-13v-6"/></g>',
    scorpStocky: '<g class="l br"><ellipse cx="92" cy="104" rx="13" ry="11"/><ellipse cx="133" cy="104" rx="32" ry="13"/><path class="t" d="M114 93v22M125 91v26M136 91v26M147 93v22"/><path class="k" d="M163 100C184 94 199 74 195 55C191 38 172 31 158 41"/><circle class="f br" cx="153" cy="46" r="7"/><path d="M148 52q-7 6-4 12"/><path class="k" d="M82 98L64 84M82 110L64 124"/><ellipse class="f br" cx="50" cy="80" rx="16" ry="10" transform="rotate(-15 50 80)"/><ellipse class="f br" cx="50" cy="128" rx="16" ry="10" transform="rotate(15 50 128)"/><path class="k" d="M36 73L22 69M37 84L24 89M36 135L22 139M37 124L24 119"/><path d="M101 114l-8 14-7 4M112 116l-4 16-6 4M124 117l1 15-5 5M136 116l5 15-2 6M101 94l-7-13-7-3M112 92l-3-15-6-3M124 91l2-15-4-4M136 92l6-13v-6"/></g>',
    rattler: '<g class="l tn"><path class="kk" d="M64 82C92 82 96 52 124 52S154 112 184 108S210 80 212 72"/><path class="t dk" d="M98 64l5-5 5 5-5 5zM122 52l5-5 5 5-5 5zM150 86l5-5 5 5-5 5zM180 106l5-5 5 5-5 5z"/><path class="f tn" d="M18 82Q22 72 36 68L52 63Q60 70 66 78V86Q60 94 52 101L36 96Q22 92 18 82Z"/><ellipse cx="40" cy="76" rx="4.5" ry="3.5"/><path class="t" d="M40 73v6"/><circle class="ff" cx="27" cy="80" r="1.8"/><g class="am"><rect x="208" y="58" width="11" height="9" rx="3" transform="rotate(-40 213 62)"/><rect x="214" y="51" width="11" height="9" rx="3" transform="rotate(-40 219 55)"/><rect x="220" y="44" width="10" height="8" rx="3" transform="rotate(-40 225 48)"/></g></g>',
    gopher: '<g class="l tn"><path class="kk" d="M50 82C92 82 96 52 124 52S154 112 184 108S206 86 210 78"/><path class="l tn" d="M210 78L230 50"/><path class="t dk" d="M96 64h8v8h-8zM120 50h8v8h-8zM148 84h8v8h-8zM178 102h8v8h-8z"/><ellipse class="f tn" cx="34" cy="82" rx="18" ry="6.5"/><circle cx="26" cy="80" r="2.6"/></g>',
    heatEx: '<g class="l"><circle cx="120" cy="44" r="18"/><path d="M120 62v46M120 76l-24 18M120 76l24 18M120 108l-16 32M120 108l16 32"/><path class="t" d="M113 40h.1M127 40h.1M114 52h12"/><path class="f" d="M92 30q-6 9 0 13q6-4 0-13zM150 34q-6 9 0 13q6-4 0-13zM96 66q-5 8 0 11q5-3 0-11zM146 70q-5 8 0 11q5-3 0-11z"/><path class="t" d="M174 98h16M182 90v16M176 92l12 12M188 92l-12 12"/></g>',
    heatStroke: '<g class="l rd"><circle cx="120" cy="46" r="18"/><path d="M120 64v44M120 78l-24 18M120 78l24 18M120 108l-16 32M120 108l16 32"/><path class="t" d="M112 44l4 3-4 3M128 44l-4 3 4 3M114 55q6-3 12 0"/><path class="t" d="M98 22q5-6 0-12M120 18q5-6 0-12M142 22q5-6 0-12"/><path class="t am" d="M150 36c0-7 11-7 11 0s-9 8-9 2"/><rect x="178" y="70" width="9" height="34" rx="4.5"/><circle class="f rd" cx="182.5" cy="110" r="7"/><text x="183" y="62" text-anchor="middle">103°F</text></g>',
    faceDroop: '<g class="l"><circle cx="120" cy="80" r="54"/><path d="M94 64q7-6 14 0"/><circle class="ff" cx="101" cy="70" r="3.5"/><path class="rd" d="M132 70q7-1 14 5"/><circle class="ff" cx="139" cy="75" r="3.5"/><path d="M120 80l-4 12h6"/><path class="rd" d="M94 102q14 10 26 4q10-4 22 12"/><path class="t rd" d="M190 88v24M183 104l7 8 7-8"/></g>',
    armsDrift: '<g class="l"><circle cx="120" cy="34" r="14"/><path d="M120 48v54M120 102l-14 42M120 102l14 42M120 60H66"/><path class="rd" d="M120 60L168 82"/><path class="t" stroke-dasharray="4 5" d="M124 60H176"/><path class="t rd" d="M190 62v24M183 78l7 8 7-8"/></g>',
    gasMeter: '<g class="l"><path class="t" d="M14 148H210"/><path class="k" d="M70 148V86H98"/><rect class="f" x="60" y="112" width="20" height="18" rx="4"/><rect class="am f" x="84" y="104" width="7" height="30" rx="2.5"/><rect class="f" x="98" y="54" width="70" height="62" rx="9"/><circle cx="117" cy="76" r="7"/><circle cx="133" cy="76" r="7"/><circle cx="149" cy="76" r="7"/><path class="t" d="M110 98h46"/><path class="k" d="M168 86H200V36"/><path class="t" d="M210 18V148"/></g>',
    valveOn: '<g class="l"><path class="kk" d="M100 6V154"/><rect class="f" x="80" y="58" width="40" height="44" rx="8"/><rect class="am f" x="128" y="40" width="16" height="80" rx="5"/><circle class="am" cx="136" cy="54" r="3.5"/><path class="t" d="M120 80h8"/></g>',
    valveOff: '<g class="l"><path class="kk" d="M100 6V154"/><rect class="f" x="80" y="58" width="40" height="44" rx="8"/><rect class="am f" x="128" y="72" width="80" height="16" rx="5"/><circle class="am" cx="194" cy="80" r="3.5"/><path class="t" d="M120 80h8"/></g>',
    chest: '<g class="l"><path d="M58 34Q120 12 182 34L198 152H42Z"/><path d="M102 26q18 12 36 0"/><path class="t" d="M120 36V112M120 52q-26 4-42 18M120 52q26 4 42 18M120 68q-24 4-38 16M120 68q24 4 38 16"/><circle class="am" cx="120" cy="88" r="17"/><circle class="am ff" cx="120" cy="88" r="5"/></g>',
    alarm: '<g class="l"><circle class="f" cx="120" cy="80" r="40"/><circle cx="120" cy="80" r="24"/><circle class="rd ff" cx="139" cy="64" r="4"/><path class="t" d="M108 80h24M110 72h20M110 88h20"/><path class="t" d="M70 56q-14 24 0 48M56 44q-22 36 0 72M170 56q14 24 0 48M184 44q22 36 0 72"/></g>',
    gen: '<g class="l"><rect class="f" x="70" y="58" width="100" height="62" rx="8"/><path d="M70 68h-9v42h9M170 68h9v42h-9"/><rect x="84" y="72" width="30" height="20" rx="3"/><circle cx="134" cy="82" r="5"/><circle cx="152" cy="82" r="5"/><circle cx="90" cy="126" r="8"/><circle cx="150" cy="126" r="8"/><path class="t am" d="M179 96q12-5 20 3q8 8 22 2M179 106q12-5 20 3q8 8 22 2"/></g>',
    aed: '<g class="l"><rect class="f" x="64" y="32" width="112" height="100" rx="12"/><path d="M100 32V22h40v10"/><path class="gr" d="M120 104l-22-22a12 12 0 0 1 22-15a12 12 0 0 1 22 15z"/><path class="am" d="M125 66l-10 16h10l-6 14"/><text x="120" y="126" text-anchor="middle">AED</text></g>',
    fridge: '<g class="l"><rect class="f" x="80" y="14" width="76" height="136" rx="9"/><path d="M80 60h76"/><path class="k" d="M145 30v18M145 74v32"/><circle class="am" cx="182" cy="40" r="17"/><path class="am" d="M182 30v10l7 5"/><text x="182" y="76" text-anchor="middle" class="am">4 h</text></g>',
    houseOut: '<g class="l"><path d="M58 150V92L110 54L162 92V150Z"/><rect x="97" y="114" width="26" height="36"/><rect class="f" x="70" y="100" width="18" height="16"/><rect class="f" x="132" y="100" width="18" height="16"/><circle class="am" cx="200" cy="40" r="14"/><path class="am t" d="M200 16v-8M200 72v-8M176 40h-8M232 40h-8M183 23l-6-6M217 57l6 6M183 57l-6 6M217 23l6-6"/><path class="t" d="M8 22L56 40"/><path class="rd" d="M62 34l10 10M72 34L62 44"/><text x="200" y="92" text-anchor="middle" class="am">112°F</text></g>',
    crawl: '<g class="l"><path class="sm" d="M0 0H240V44q-20 10-40 0t-40 0t-40 0t-40 0t-40 0t-40 0Z"/><path class="t" d="M0 150H240"/><circle cx="78" cy="110" r="10"/><path d="M88 114L140 120M98 116l-4 32M108 117l4 31M140 120l12 28M140 120l-4 28"/><path class="gr" d="M164 132h34M188 122l10 10-10 10"/><rect class="gr" x="208" y="86" width="24" height="64"/></g>',
    doorHot: '<g class="l"><rect class="f" x="78" y="12" width="84" height="138" rx="5"/><circle class="rd ff" cx="148" cy="84" r="6"/><path class="rd t" d="M164 70q6-7 0-14M174 74q6-7 0-14M168 104q6-7 0-14"/><path class="t sm2" d="M72 156q10-8 20 0t20 0t20 0t20 0t20 0"/></g>',
    meet: '<g class="l"><path d="M16 150V102L52 74L88 102V150Z"/><path class="t" d="M58 62q-8-10 0-20q8-10 0-20"/><path d="M200 150V108"/><circle class="f gr" cx="200" cy="88" r="24"/><circle cx="142" cy="116" r="6"/><path d="M142 122v20"/><circle cx="158" cy="112" r="7"/><path d="M158 119v24"/><circle cx="174" cy="120" r="5"/><path d="M174 125v16"/><path class="gr t" stroke-dasharray="5 5" d="M94 140H130"/></g>',
    collapse: '<g class="l"><path class="t" d="M10 140H230"/><circle cx="62" cy="124" r="12"/><path d="M74 128H152M152 128l30 3M152 128l30 11M96 128l10 11"/><path class="rd" d="M120 64v26M120 100v3"/></g>',
    bedNight: '<g class="l"><path class="am" d="M44 24a17 17 0 1 0 19 23a13 13 0 1 1-19-23z"/><circle class="f" cx="152" cy="22" r="10"/><path class="t rd" d="M134 28q-7 9 0 18M170 28q7 9 0 18"/><path d="M36 134V102H204V134M36 118H204M36 102V84"/><rect x="44" y="92" width="28" height="9" rx="3"/><path class="f" d="M76 102q60-22 122 0"/></g>'
  },
  list: [
    /* ---------------- TRAIN ---------------- */
    { id: "cpr-beat", card: "cpr", kind: "train", type: "beat", title: "CPR Beat", sub: "Tap to the beat", icon: "heart", art: "chest", secs: 20,
      say: "Tap the chest to the beat: one hundred to one hundred and twenty a minute. Keep going when the beat stops.",
      tip: "Real CPR: heel of one hand on the center of the chest, other hand on top, at least 2 in deep. Let the chest come all the way back up.",
      from: "the CPR card" },
    { id: "alarm-id", card: "co", kind: "train", type: "quiz", title: "Alarm ID", sub: "Listen and name it", icon: "speaker", art: "alarm", shuffle: true,
      frames: [
        { sound: "t3", art: "alarm", q: "What is this alarm telling you?", choices: [{ t: "Smoke or fire", ok: 1 }, { t: "Carbon monoxide" }, { t: "Low battery" }],
          ok: "Three long beeps, a pause, three again: smoke or fire. Get out, stay out, and call 911 from outside." },
        { sound: "t4", art: "alarm", q: "What is this alarm telling you?", choices: [{ t: "Smoke or fire" }, { t: "Carbon monoxide", ok: 1 }, { t: "Low battery" }],
          ok: "Four quick beeps, then a pause: carbon monoxide. Everyone outside now, then call 911. Stay out." },
        { sound: "chirp", art: "alarm", q: "What is this alarm telling you?", choices: [{ t: "Smoke or fire" }, { t: "Carbon monoxide" }, { t: "Low battery", ok: 1 }],
          ok: "One chirp every 30 to 60 seconds: the battery is low. Still chirping with a new battery? Replace the alarm." }
      ],
      src: [{ n: "NFPA via Purdue Extension: learn the sounds of fire safety", u: "https://www.purdue.edu/engineering/ABE/INPREPared/national-fire-prevention-week-october-3-9-learn-the-sounds-of-fire-safety/" },
        { n: "Kidde: smoke and CO alarm patterns", u: "https://help.kidde.com/hc/en/6-kidde/faq/685-what-are-the-various-audible-alarms-and-visual-indicators-that-the-smoke-carbon-monoxide-alarm-uses/?p=all" }],
      from: "the CO alarm card" },
    { id: "escape", kind: "train", type: "drill", title: "2-Minute Drill", sub: "Time your family", icon: "evac", art: "meet", goal: 120,
      say: "A home fire can leave as little as two minutes to get out. Start the clock, everyone out to the meeting place, then stop.",
      tips: ["Practice twice a year, once at night.", "Two ways out of every room.", "Meet at something that doesn't move: a tree, a mailbox."],
      src: [{ n: "Minnesota State Fire Marshal: fire escape planning", u: "https://dps.mn.gov/divisions/sfm/fire-safety/fire-safety-tips/fire-escape-planning-tips" },
        { n: "Seattle Children's: could your family get out in two minutes?", u: "https://www.seattlechildrens.org/healthy-tides/fire-escape-plans/" }] },

    /* ---------------- SCAN: know it when you see it ---------------- */
    { id: "scan-scorpion", card: "scorpion", kind: "scan", type: "quiz", title: "Bark scorpion", sub: "Know the dangerous one", icon: "bug", art: "scorpBark",
      frames: [
        { scan: 1, art: "scorpBark", uv: 1, title: "Arizona bark scorpion", sub: "The one that matters in Phoenix",
          marks: [["Thin pincers", 13, 47], ["Long, thin tail", 80, 24], ["2 to 3 in, tan", 55, 82], ["Climbs walls and ceilings", 50, 8]],
          say: "Arizona bark scorpion. Thin pincers, a long thin tail, two to three inches, tan. It climbs walls and ceilings. Tap U V: it glows under a black light." },
        { q: "Which one is the bark scorpion?", choices: [{ art: "scorpStocky", t: "Thick pincers" }, { art: "scorpBark", t: "Thin pincers", ok: 1 }],
          ok: "Thin pincers and a thin tail. Thick, crab-like pincers usually mean a less dangerous kind. A sting gets the same care either way." },
        { q: "Where do bark scorpions turn up?", choices: [{ t: "Up walls and ceilings, indoors", ok: 1 }, { t: "Only deep underground" }, { t: "Only in water" }],
          ok: "They climb, and they come indoors. A black light makes them glow at night." },
        { q: "Someone is stung. Who do you call?", choices: [{ t: "Poison Control", ok: 1 }, { t: "No one, it's fine" }, { t: "The pest company" }],
          ok: "Poison Control, 1-800-222-1222, free and open 24/7. Trouble breathing, or a child with odd eye movements or drooling: 911." }
      ],
      src: [{ n: "National Park Service: Arizona bark scorpion", u: "https://www.nps.gov/articles/bark-scorpion.htm" }, { n: "UC IPM: scorpions", u: "https://ipm.ucanr.edu/PMG/PESTNOTES/pn74110.html" }],
      from: "the Scorpion sting card" },
    { id: "scan-snake", card: "snake", kind: "scan", type: "quiz", title: "Rattlesnake", sub: "Spot it, give it room", icon: "snake", art: "rattler",
      frames: [
        { scan: 1, art: "rattler", title: "Rattlesnake", sub: "Know it, give it room",
          marks: [["Wide triangle head, thin neck", 18, 30], ["Pits and cat-eye pupils", 14, 66], ["Rattle (can be missing)", 86, 18], ["Blunt, rounded tail", 77, 62]],
          say: "Rattlesnake. A wide triangle head on a thin neck, and a rattle, which can be missing. The tail stays blunt." },
        { q: "Which one is the rattlesnake?", choices: [{ art: "gopher", t: "Narrow head, pointed tail" }, { art: "rattler", t: "Triangle head, rattle", ok: 1 }],
          ok: "Triangle head and a blunt, rattled tail. A gopher snake has a narrow head and a pointed tail." },
        { q: "One is on the path ahead. What do you do?", choices: [{ t: "Back away and go around", ok: 1 }, { t: "Poke it to move it" }, { t: "Pick it up by the tail" }],
          ok: "Give it room and go around. Never touch one, even a dead one: the head can still bite for hours." },
        { q: "Someone is bitten. What helps?", choices: [{ t: "Call 911, keep them still and calm", ok: 1 }, { t: "Ice and a tight band" }, { t: "Cut and suck the bite" }],
          ok: "911: every bite needs the emergency room. No tourniquet, ice, cutting or sucking." }
      ],
      src: [{ n: "National Park Service: rattlesnakes (Coronado)", u: "https://www.nps.gov/coro/learn/nature/rattlesnakes.htm" }, { n: "Arizona Game and Fish: western diamond-backed rattlesnake", u: "https://reptilesofaz.org/snakes-subpages/h-c-atrox" }],
      from: "the Rattlesnake bite card" },
    { id: "scan-heat", kind: "scan", type: "quiz", title: "Heat: which is it?", sub: "Exhaustion or stroke", icon: "thermo", art: "heatStroke",
      frames: [
        { scan: 1, art: "heatEx", art2: "heatStroke", title: "Heat exhaustion vs heat stroke", sub: "Confusion is the line",
          marks: [["Heavy sweat", 25, 18], ["Cold, pale, clammy", 25, 86], ["Hot, red skin", 75, 18], ["Confused: call 911", 75, 86]],
          say: "Heat exhaustion: heavy sweating and cold, pale, clammy skin. Heat stroke: hot, red skin and confusion. Confusion means nine one one." },
        { art: "heatEx", q: "Sweating hard, pale and clammy, but thinking clearly. Which is it?", choices: [{ t: "Heat exhaustion", ok: 1 }, { t: "Heat stroke" }],
          ok: "Heat exhaustion: a cooler place, loosen clothes, cool wet cloths, sips of water. Throwing up, worse, or over an hour: get medical help." },
        { art: "heatStroke", q: "Hot, red skin, and confused. Which is it?", choices: [{ t: "Heat exhaustion" }, { t: "Heat stroke", ok: 1 }],
          ok: "Heat stroke: call 911 and cool them now. Give nothing to drink." },
        { q: "Heat stroke. The best way to cool them?", choices: [{ t: "Cold water up to the neck", ok: 1 }, { t: "A glass of ice water" }, { t: "Rest in the shade and wait" }],
          ok: "Cold-water immersion up to the neck is best. Otherwise soak them, fan them, and ice the neck, armpits and groin." }
      ],
      card: "heatstroke", from: "the Heat stroke card" },
    { id: "scan-stroke", card: "stroke", kind: "scan", type: "quiz", title: "Stroke: BE FAST", sub: "Six signs, one call", icon: "brain", art: "faceDroop",
      frames: [
        { scan: 1, art: "faceDroop", title: "BE FAST", sub: "Balance · Eyes · Face · Arms · Speech · Time",
          marks: [["Eyelid droops", 74, 30], ["Smile droops on one side", 66, 80]],
          say: "Be fast. Balance. Eyes. Face. Arms. Speech. Time to call nine one one. Any one sign is enough." },
        { art: "faceDroop", q: "You ask them to smile. Is this a stroke sign?", choices: [{ t: "Yes: one side droops", ok: 1 }, { t: "No, that's normal" }],
          ok: "Face droop. Any one sign: call 911 now, even if it goes away." },
        { art: "armsDrift", q: "Both arms up. One drifts down. Now what?", choices: [{ t: "Call 911 now", ok: 1 }, { t: "Wait an hour and see" }, { t: "Drive them to the hospital" }],
          ok: "Call 911. Don't drive them yourself unless 911 can't be reached." },
        { q: "Which time do you tell 911?", choices: [{ t: "When they were last seen well", ok: 1 }, { t: "When the ambulance comes" }, { t: "It doesn't matter" }],
          ok: "When it started, or when they were last seen well. Tell the dispatcher: I think this is a stroke." }
      ],
      from: "the Stroke card" },
    { id: "scan-gas", kind: "scan", type: "quiz", title: "Gas shutoff", sub: "On, off, and when", icon: "gas", art: "gasMeter",
      frames: [
        { scan: 1, art: "gasMeter", title: "Gas meter shutoff", sub: "Find yours before you need it",
          marks: [["Valve on the pipe, near the ground", 17, 88], ["Tab in line with pipe: ON", 44, 62], ["Gas meter", 55, 24]],
          say: "The gas valve is on the pipe next to the meter, near the ground. A tab in line with the pipe means on. A quarter turn, crosswise, means off." },
        { q: "Which valve is OFF?", choices: [{ art: "valveOn", t: "In line" }, { art: "valveOff", t: "Crosswise", ok: 1 }],
          ok: "Crosswise to the pipe is off. A 12-inch wrench turns it a quarter turn. Keep one with your emergency supplies." },
        { q: "When should you shut it off?", choices: [{ t: "You smell gas or suspect a leak, and it's safe", ok: 1 }, { t: "Every time the power goes out" }, { t: "Every night" }],
          ok: "Only for a smell or sign of a leak, and only if it's safe to do." },
        { q: "It's off. Who turns it back on?", choices: [{ t: "The gas company", ok: 1 }, { t: "You, once the smell is gone" }, { t: "A neighbor" }],
          ok: "Leave it off. The gas company turns it back on and relights the pilot lights." }
      ],
      src: [{ n: "SoCalGas: how to shut off your natural gas", u: "https://www.socalgas.com/safety/emergency-information/shut-off-natural-gas" }, { n: "SDG&E: emergency gas shut-off", u: "https://www.sdge.com/safety/gas-safety/emergency-shut-off" }, { n: "Long Beach: when to turn off your gas", u: "https://www.longbeach.gov/ees/safety/emergency-gas-shut-off/" }] },

    /* ---------------- MISSIONS: one minute, five calls ---------------- */
    { id: "m-power", card: "co", kind: "mission", type: "quiz", title: "Power out, 112°F", sub: "Phoenix, July", icon: "bolt", art: "houseOut", scene: "3:07 PM · 112°F · POWER OUT",
      frames: [
        { art: "houseOut", q: "The power just went out. First move?", choices: [{ t: "Check on everyone, start the outage clock", ok: 1 }, { t: "Open the fridge to check the food" }, { t: "Light candles" }],
          ok: "People first. Start the outage clock, and keep the fridge and freezer shut." },
        { art: "fridge", q: "How long does a shut fridge keep food safe?", choices: [{ t: "About 4 hours", ok: 1 }, { t: "About a day" }, { t: "About a week" }],
          ok: "About 4 hours if it stays shut. A full freezer about 48 hours, half full about 24." },
        { art: "gen", q: "Where does the generator run?", choices: [{ t: "Outside, 20 ft from doors and windows", ok: 1 }, { t: "In the garage, door open" }, { t: "On the patio, by a window" }],
          ok: "Outdoors only, 20 ft from doors, windows and vents, exhaust pointed away. Never in a garage, even with the door open." },
        { art: "houseOut", q: "It's getting hot inside. Grandma is 78. Now?", choices: [{ t: "Get her somewhere cool now", ok: 1 }, { t: "Wait for the power" }, { t: "A hot shower" }],
          ok: "Hot inside, and anyone is over 65, an infant or chronically ill: leave for somewhere cool." },
        { art: "alarm", q: "The CO alarm goes off. What do you do?", choices: [{ t: "Everyone outside, then call 911", ok: 1 }, { t: "Open a window and stay" }, { t: "Look for the source" }],
          ok: "Everyone outside now, then call 911 from outside. Don't look for the source." }
      ],
      from: "the Power out playbook and the CO alarm card" },
    { id: "m-collapse", card: "cpr", kind: "mission", type: "quiz", title: "Someone collapses", sub: "Kitchen, evening", icon: "heart", art: "collapse", scene: "7:42 PM · KITCHEN · DAD IS DOWN",
      frames: [
        { art: "collapse", q: "Dad drops to the floor. First?", choices: [{ t: "Tap and shout: breathing normally?", ok: 1 }, { t: "Give him water" }, { t: "Wait and see" }],
          ok: "Tap and shout. Not responding and not breathing normally: start CPR. Gasping is not normal breathing." },
        { art: "collapse", q: "No response. He's gasping. Next?", choices: [{ t: "Call 911 on speaker", ok: 1 }, { t: "Drive him to the ER" }, { t: "Text the family" }],
          ok: "Call 911 on speaker and send someone for an AED. The dispatcher can coach you." },
        { art: "chest", q: "Where do your hands go?", choices: [{ t: "Center of the chest", ok: 1 }, { t: "On the belly" }, { t: "Left side, over the heart" }],
          ok: "Heel of one hand on the center of the chest, the other on top, arms straight." },
        { art: "chest", q: "How fast do you push?", choices: [{ t: "100 to 120 a minute", ok: 1 }, { t: "60 a minute" }, { t: "As fast as you can" }],
          ok: "100 to 120 a minute, at least 2 in deep. Let the chest come all the way back up." },
        { art: "aed", q: "The AED arrives. Now?", choices: [{ t: "Turn it on, follow its voice", ok: 1 }, { t: "Stop CPR and wait" }, { t: "Read the manual first" }],
          ok: "Turn it on and follow its voice. Keep pushing until it tells you to stop." }
      ],
      next: "cpr-beat", from: "the CPR card" },
    { id: "m-night", kind: "mission", type: "quiz", title: "Alarm at 2 AM", sub: "Get everyone out", icon: "flame", art: "bedNight", scene: "2:14 AM · BEDROOM · ALARM",
      frames: [
        { sound: "t3", art: "bedNight", q: "That sound. What is it?", choices: [{ t: "Smoke alarm: fire", ok: 1 }, { t: "Carbon monoxide" }, { t: "Low battery" }],
          ok: "Three beeps and a pause: smoke or fire. You may have as little as two minutes." },
        { art: "crawl", q: "Smoke in the hall. How do you move?", choices: [{ t: "Get low, under the smoke", ok: 1 }, { t: "Stand up and run" }, { t: "Hide under the bed" }],
          ok: "Get low and go under the smoke, straight to a way out." },
        { art: "doorHot", q: "The door handle is hot. Now?", choices: [{ t: "Use your second way out", ok: 1 }, { t: "Open it fast" }, { t: "Wait for it to cool" }],
          ok: "Test doors with the back of your hand. Hot: use your second way out. Every room needs two." },
        { art: "meet", q: "You're out. The cat is still inside.", choices: [{ t: "Stay out, tell the firefighters", ok: 1 }, { t: "Run back in for it" }, { t: "Send someone in" }],
          ok: "Get out and stay out. Tell the firefighters who or what is still inside." },
        { art: "meet", q: "Where does everyone go?", choices: [{ t: "The outside meeting place", ok: 1 }, { t: "The car in the garage" }, { t: "Back to the front door" }],
          ok: "Your meeting place outside, like a tree or a mailbox. Call 911 from there." }
      ],
      next: "escape",
      src: [{ n: "Minnesota State Fire Marshal: fire escape planning", u: "https://dps.mn.gov/divisions/sfm/fire-safety/fire-safety-tips/fire-escape-planning-tips" },
        { n: "Seattle Children's: fire escape plans", u: "https://www.seattlechildrens.org/healthy-tides/fire-escape-plans/" },
        { n: "First Alert: plan your emergency escape route", u: "https://firstalert.com/ca/en/safety-corner/emergency-escape-plan" }] }
  ]
};
if (typeof module !== "undefined") module.exports = HAVYN_SIMS;
