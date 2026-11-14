/* HAVYN FIELD — protocol content.
   Every card and playbook line is written from the sources listed with it.
   "reviewed" = date the text was checked against those sources (an independent pass, 2026-11-14).
   "gate" = the human review still required before the family relies on it. */
const HAVYN_CONTENT = {
  reviewed: "2026-11-14",
  gate: "Awaiting EMT or nurse review",
  noSignal: "No signal? Keep dialing 911: it can connect through another carrier. iPhone 14 or later offers Emergency SOS via satellite outdoors. If help truly can't come, get them to the nearest ER.",

  cards: [
    {
      id: "cpr", title: "CPR", sub: "Teen or adult not responding, not breathing normally", icon: "heart",
      steps: [
        { t: "Tap and shout. Breathing normally?", d: "Not responding and not breathing normally means start CPR. Gasping is not normal breathing." },
        { t: "Call 911 on speaker", d: "Send someone to find an AED. The dispatcher can coach you." },
        { t: "Hands on the center of the chest", d: "Heel of one hand, other hand on top. Arms straight, shoulders over your hands." },
        { t: "Push hard and fast", d: "100 to 120 a minute, to the beat. At least 2 in (5 cm), not more than 2.4 in (6 cm). Let the chest come all the way back up.", beat: 110 },
        { t: "AED here? Turn it on", d: "Follow its voice. Keep pushing until it tells you to stop." },
        { t: "Do not stop", d: "Keep going until help takes over or they breathe normally. If someone can take over, switch about every 2 minutes." }
      ],
      note: "Trained in breaths? 30 pushes, then 2 breaths. Breaths matter most after drowning, carbon monoxide or choking. Child or baby: use the CPR child card.",
      sources: [
        { n: "AHA 2025 guidelines: Adult Basic Life Support", u: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support" },
        { n: "American Heart Association: Hands-Only CPR", u: "https://www.heart.org/-/media/Files/Nation-of-Lifesavers/How-to-Perform-CPR-Infographic.pdf" }
      ]
    },
    {
      id: "cprchild", title: "CPR child", sub: "Child or baby not responding, not breathing normally", icon: "heart",
      steps: [
        { t: "Tap and shout. Breathing normally?", d: "Baby: tap the foot. Not responding and not breathing normally means start CPR. Gasping is not normal breathing." },
        { t: "Call 911 on speaker", d: "Alone with no phone at hand: give about 2 minutes of CPR first, then go call." },
        { t: "Hand position", d: "Child: heel of one or two hands, center of the chest. Baby under 1: heel of one hand, center of the chest just below the nipple line." },
        { t: "Push fast, the right depth", d: "100 to 120 a minute. Child: about 2 in (5 cm). Baby: about 1.5 in (4 cm). Let the chest come all the way back up.", beat: 110 },
        { t: "If you can: 30 pushes, then 2 breaths", d: "Each breath just enough to make the chest rise. Breaths matter for children and babies." },
        { t: "Do not stop", d: "Keep going until help takes over or they breathe normally. AED: use it, with child pads if it has them." }
      ],
      note: "",
      sources: [
        { n: "AHA 2025 guidelines: Pediatric Basic Life Support", u: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/pediatric-basic-life-support" },
        { n: "AHA: Updated CPR guidelines (infant compressions)", u: "https://www.heart.org/en/healthy-living/live-fierce/updated-cpr-guidelines-aim-to-save-more-lives" }
      ]
    },
    {
      id: "choking", title: "Choking", sub: "Can't breathe, cough or speak", icon: "choke",
      steps: [
        { t: "Ask: are you choking?", d: "If they can cough hard or talk, let them keep coughing and stay with them." },
        { t: "Can't breathe, cough or speak? Call 911", d: "Or have someone else call while you act." },
        { t: "5 back blows", d: "Stand behind and slightly to the side. Lean them forward. Hit firmly between the shoulder blades with the heel of your hand." },
        { t: "5 abdominal thrusts", d: "Fist just above the belly button, other hand over it. Quick pulls inward and upward." },
        { t: "Repeat 5 and 5", d: "Keep alternating until the object comes out or they stop responding." },
        { t: "Pregnant or too big to reach around?", d: "Use 5 chest thrusts instead: hands at the base of the breastbone, quick hard thrusts." },
        { t: "They collapse: start CPR", d: "Lower them to the ground, make sure 911 is called, and start CPR. If you see the object in the mouth, take it out. Never sweep blindly with a finger.", link: "cpr" }
      ],
      note: "Baby under 1 year: face down along your forearm, head lower than chest. 5 back blows, then turn face up: 5 chest thrusts with the heel of one hand. Repeat. Never abdominal thrusts on a baby. Baby stops responding: start child CPR.",
      noteLink: "cprchild",
      sources: [
        { n: "AHA 2025 adult choking algorithm", u: "https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-BLS-Adult-FBAO-250630.pdf" },
        { n: "AHA 2025 guidelines: choking update", u: "https://newsroom.heart.org/news/updated-cpr-guidelines-tackle-choking-response-opioid-related-emergencies-and-a-revised-chain-of-survival" },
        { n: "Mayo Clinic: choking first aid (positions)", u: "https://www.mayoclinic.org/first-aid/first-aid-choking/basics/art-20056637" }
      ]
    },
    {
      id: "bleeding", title: "Bleeding", sub: "Life-threatening bleeding", icon: "drop",
      steps: [
        { t: "Make sure you are safe. Call 911", d: "Put on gloves if you have them." },
        { t: "Find where the blood comes from", d: "Open or cut away clothing to see the wound." },
        { t: "Press hard with both hands", d: "Directly on the wound, with gauze or any clean cloth. Do not let up." },
        { t: "Arm or leg? Tourniquet", d: "2 to 3 in above the wound, never on a joint. Tighten until the bleeding stops, even though it hurts." },
        { t: "Neck, armpit or groin, or no tourniquet? Pack it", d: "Stuff gauze or clean cloth tightly into the wound, then press hard with both hands." },
        { t: "Note the time. Never loosen it", d: "Write the time on the tourniquet or skin. Still bleeding? Add a second tourniquet above the first." },
        { t: "Keep pressure until help takes over", d: "Do not lift the packing to check it." }
      ],
      note: "Chest or belly wound: press on it and get help fast. Don't pack chest or belly wounds.",
      sources: [
        { n: "Stop the Bleed (American College of Surgeons): booklet", u: "https://police.ucsd.edu/_files/Stop-the-Bleed.pdf" },
        { n: "American Red Cross: how to apply a tourniquet", u: "https://www.redcross.org/take-a-class/resources/articles/how-to-apply-a-tourniquet" },
        { n: "Stop the Bleed v2.0 course (Arizona DHS)", u: "https://apps.azdot.gov/files/24/aztt/Learn-the-Basics-of-Bleeding-Control-(B-Con)-Course-ADHS.pdf" }
      ]
    },
    {
      id: "anaphylaxis", title: "Allergy", sub: "Anaphylaxis: severe allergic reaction", icon: "allergy",
      steps: [
        { t: "Spot it", d: "After a food, sting or medicine: trouble breathing or wheezing, tight throat, swollen lips or tongue, hives all over, repeated vomiting, pale or blue skin, dizziness or fainting. Or mild signs in two body areas at once." },
        { t: "Epinephrine now", d: "Auto-injector: middle of the outer thigh, through clothing is fine. Nasal spray: into one nostril. Follow the device's own instructions." },
        { t: "Call 911. Say anaphylaxis", d: "They need the ER even if they start to feel better." },
        { t: "Lay them flat, legs raised", d: "Trouble breathing: let them sit up. Vomiting: turn them on their side." },
        { t: "No better after 5 minutes?", d: "Or getting worse: give a second dose with a new device, if you have one." },
        { t: "Stops responding, not breathing normally: CPR", d: "Start CPR and keep going until help arrives.", link: "cpr" }
      ],
      note: "Epinephrine is the first treatment. Don't rely on antihistamines or inhalers instead.",
      sources: [
        { n: "FARE food allergy and anaphylaxis emergency care plan (8/2025)", u: "https://www.vdh.virginia.gov/content/uploads/sites/58/ECP-FAAP-FARE-Food-Allergy-and-Anaphylaxis-Emergency-Care-Plan.pdf" },
        { n: "2024 AHA and Red Cross first aid guidelines", u: "https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines" },
        { n: "Cleveland Clinic: how to use an EpiPen", u: "https://health.clevelandclinic.org/how-to-use-an-epipen" }
      ]
    },
    {
      id: "stroke", title: "Stroke", sub: "BE FAST", icon: "brain",
      steps: [
        { t: "B: Balance", d: "Sudden loss of balance or coordination?" },
        { t: "E: Eyes", d: "Sudden loss or change of vision?" },
        { t: "F: Face", d: "Ask them to smile. Does one side droop?" },
        { t: "A: Arms", d: "Ask them to raise both arms. Does one drift down?" },
        { t: "S: Speech", d: "Slurred, strange, or unable to speak?" },
        { t: "T: Time to call 911", d: "Any one sign, call now, even if it goes away. Note the time it started or when they were last seen well. Don't drive them yourself unless 911 can't be reached." }
      ],
      note: "Tell the dispatcher: I think this is a stroke.",
      sources: [
        { n: "American Stroke Association: stroke facts (BE FAST)", u: "https://www.stroke.org/stroke-facts" },
        { n: "American Stroke Association: warning signs", u: "https://www.stroke.org/en/help-and-support/resource-library/lets-talk-about-stroke/stroke-tia-and-warning-signs" },
        { n: "CDC: stroke signs (don't drive)", u: "https://www.cdc.gov/stroke/signs-symptoms/index.html" },
        { n: "Harvard Health: last seen well", u: "https://www.health.harvard.edu/heart-health/recognizing-the-most-common-warning-signs-of-a-stroke" }
      ]
    },
    {
      id: "heatstroke", title: "Heat stroke", sub: "Hot, confused, collapsing", icon: "sun",
      steps: [
        { t: "Spot it", d: "Body 103°F or higher. Hot, red, dry or damp skin. Fast, strong pulse. Confusion or passing out. No thermometer? Confusion in the heat is enough." },
        { t: "Call 911", d: "Heat stroke is a medical emergency." },
        { t: "Move them somewhere cooler", d: "Shade, indoors, a cool car parked outside." },
        { t: "Cool them now", d: "Cold-water immersion up to the neck is best: 15 minutes, or until they are no longer confused. Otherwise soak them with cold water and fan them, and put ice or cold packs on the neck, armpits and groin." },
        { t: "Give nothing to drink", d: "CDC's rule for heat stroke." },
        { t: "Keep cooling until they improve or help arrives", d: "Stops responding, not breathing normally: start CPR.", link: "cpr" }
      ],
      note: "Alert and thinking clearly, with heavy sweating, cold clammy skin or cramps? Likely heat exhaustion: see the Heat playbook. Any confusion: treat as heat stroke.",
      sources: [
        { n: "CDC: heat-related illness", u: "https://www.cdc.gov/disasters/extremeheat/pdf/Heat_Related_Illness.pdf" },
        { n: "American Red Cross: heat stroke", u: "https://www.redcross.org/take-a-class/resources/learn-first-aid/heat-stroke" },
        { n: "2024 AHA and Red Cross first aid guidelines (immersion time)", u: "https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines" },
        { n: "CDC NIOSH: heat illnesses (ice locations)", u: "https://www.cdc.gov/niosh/heat-stress/about/illnesses.html" }
      ]
    },
    {
      id: "co", title: "CO alarm", sub: "Carbon monoxide", icon: "gas",
      steps: [
        { t: "Everyone outside now", d: "Alarm, or headache, dizziness, nausea, confusion. Don't look for the source." },
        { t: "Call 911 from outside", d: "Tell them a carbon monoxide alarm went off." },
        { t: "Count everyone, pets too", d: "Do not go back inside for anyone or anything." },
        { t: "Stay out until responders say it's safe", d: "Don't restart the generator, stove or heater." },
        { t: "Anyone sick, sleepy or confused?", d: "Tell 911 it may be carbon monoxide. They need medical care. Can't reach 911? Poison Control: 1-800-222-1222." },
        { t: "Not responding, not breathing normally: CPR", d: "Give breaths if you are trained.", link: "cpr" }
      ],
      note: "Generators, grills, camp stoves and cars: never indoors, in a garage, carport or basement, even with doors or windows open. Generators at least 20 ft from doors, windows and vents, exhaust pointed away.",
      sources: [
        { n: "Oregon State Fire Marshal: if your CO alarm sounds", u: "https://www.oregon.gov/osfm/education/Pages/carbon-monoxide.aspx" },
        { n: "CPSC: carbon monoxide questions and answers", u: "https://www.cpsc.gov/Safety-Education/Safety-Education-Centers/Carbon-Monoxide-Information-Center/Carbon-Monoxide-Questions-and-Answers" },
        { n: "CDC: during a power outage (Poison Control)", u: "https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-during-a-power-outage.html" },
        { n: "CPSC 2026: generator CO warning", u: "https://www.cpsc.gov/Newsroom/News-Releases/2026/CPSC-Warns-of-Generator-Carbon-Monoxide-and-Fire-Hazards-Ahead-of-Hurricane-Season" }
      ]
    },
    {
      id: "burns", title: "Burns", sub: "Heat, chemical, electrical", icon: "flame",
      steps: [
        { t: "Stop the burning", d: "Away from the heat. Take off jewelry and clothing near the burn, unless it is stuck." },
        { t: "Cool running water, right away", d: "Cool, not ice. At least 10 minutes, ideally 20. No running water? Use a clean, cool wet cloth. Large burn or small child: watch that they don't get too cold." },
        { t: "Cover loosely", d: "Clean, dry, non-stick dressing or clean cloth." },
        { t: "Don't pop blisters", d: "No butter, oil or toothpaste." },
        { t: "When to call 911", d: "Deep burns, or larger than 3 in. Face, hands, feet, groin or a major joint. Wraps around an arm, leg, chest or neck. Chemical, electrical or explosion burns. Breathed in smoke, or any trouble breathing. Babies, young children and older adults." }
      ],
      note: "Chemical burn: protect your hands, brush off dry powder, remove soaked clothing, then rinse with lots of running water for at least 15 minutes. Eye: keep rinsing until help arrives. Electrical burn: make sure the power is off at the source before you touch them. In a blackout it can come back at any moment. Be ready to start CPR.",
      sources: [
        { n: "American Red Cross: burns", u: "https://www.redcross.org/take-a-class/resources/learn-first-aid/burns" },
        { n: "2024 AHA and Red Cross first aid guidelines", u: "https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines" },
        { n: "American Red Cross: burn cooling advisory", u: "https://www.redcross.org/content/dam/redcross/docs/Burn%20Cooling%E2%80%94ADVISORY.pdf" },
        { n: "Mayo Clinic: burns first aid", u: "https://www.mayoclinic.org/first-aid/first-aid-burns/basics/art-20056649" }
      ]
    },
    {
      id: "seizure", title: "Seizure", sub: "Shaking, unresponsive", icon: "pulse",
      steps: [
        { t: "Ease them to the ground", d: "Move hard and sharp things away." },
        { t: "Protect the head", d: "Something soft and flat under the head. Take off glasses. Loosen anything around the neck." },
        { t: "Turn them on their side", d: "Gently, mouth pointing to the ground, to keep the airway clear." },
        { t: "Time it. Hands off", d: "Don't hold them down. Put nothing in their mouth." },
        { t: "Call 911 if", d: "Over 5 minutes. Another seizure soon after. Trouble breathing or waking. Not back to normal. Injured. In water. First seizure. Pregnant or diabetic." },
        { t: "Stay until they are fully awake", d: "No food or drink until fully alert." }
      ],
      note: "Don't give rescue breaths during the seizure. Breathing usually restarts on its own afterward.",
      sources: [
        { n: "CDC: first aid for seizures", u: "https://www.cdc.gov/epilepsy/first-aid-for-seizures/index.html" },
        { n: "Epilepsy Foundation: first aid resources", u: "https://www.epilepsy.com/recognition/first-aid-resources" }
      ]
    }
  ],

  playbooks: [
    {
      id: "blackout", title: "Blackout", sub: "Power out at home", icon: "bolt",
      trigger: "The power is out at home, or the utility reports an outage.",
      leave: [
        "Hot weather: an extreme-heat warning and an outage expected past 24 hours.",
        "Hot inside and anyone is an infant, over 65 or chronically ill.",
        "Any sign of heat exhaustion.",
        "A medical device's backup power is running out.",
        "CO alarm: outside immediately, then follow the CO card."
      ],
      phases: [
        { label: "First 10 minutes", items: [
          { t: "Start the outage clock", d: "Status switches to consumption mode: run-out dates use what you log.", act: "outage-start" },
          { t: "Check on everyone", d: "Anyone on powered medical equipment switches to its backup battery now." },
          { t: "Keep the fridge and freezer shut", d: "Closed fridge: food stays safe about 4 hours. Full freezer about 48 hours, half full about 24.", s: "cdcfood" },
          { t: "Text family, don't call", d: "Texts get through busy networks more often than calls. 911 is always a call. Phones on Low Power Mode.", s: "fcc" },
          { t: "Flashlights and headlamps, not candles", s: "cdcpo" },
          { t: "Unplug appliances and electronics", d: "Power can come back with surges. Leave one lamp switched on so you know when it returns.", s: "fema" }
        ]},
        { label: "First hour", items: [
          { t: "Check the outage map or alerts while data works", d: "Cell towers run on backup batteries, often only a few hours." },
          { t: "Text your out-of-area contact: OK + location", d: "Family plan, then Contacts." },
          { t: "Confirm check-in times: 08:00, 12:00, 18:00", d: "5 minutes each. Radios off in between to save battery." },
          { t: "Summer: open the Heat playbook now", go: "heat" },
          { t: "If you have a waterBOB, fill it now", d: "While the water pressure holds." }
        ]},
        { label: "First day", items: [
          { t: "Fridge food: toss after 4 hours without power", d: "Meat, fish, eggs, milk, leftovers, cut fruit and vegetables, unless you had a cold source. When in doubt, throw it out.", s: "cdcfood" },
          { t: "Above 90°F, don't leave food out more than 1 hour", s: "usda" },
          { t: "Generators, grills, camp stoves: outdoors only", d: "Never indoors, in a garage, carport or basement, even with doors open. Generator at least 20 ft from doors, windows and vents, exhaust pointed away.", s: "co" },
          { t: "Charge from the power station or a car parked outside", d: "Never run a car in a garage, even with the door open.", s: "cpsc" },
          { t: "Drink what you need. Don't ration water", d: "Unless the authorities tell you to. In very hot weather, needs can double.", s: "readywater" },
          { t: "Check on family and neighbors", d: "Older adults and young children are most at risk from heat.", s: "fema" }
        ]},
        { label: "Days 2 to 14", items: [
          { t: "Log what you use in Supplies", d: "Status then shows real run-out dates." },
          { t: "Freezer food: refreeze only if it still has ice crystals or is 40°F or colder", s: "cdcfood" },
          { t: "Water or sewer down? Switch to the bucket toilet kit" },
          { t: "Refrigerated medicine: keep using life-sustaining drugs like insulin until you get a new supply", d: "Check the label or ask a pharmacist how long it lasts unrefrigerated.", s: "cdcpo" },
          { t: "Every summer morning: check the leave-now rule" }
        ]}
      ],
      sources: ["cdcfood", "usda", "co", "cpsc", "cdcpo", "fcc", "fema", "readywater"]
    },
    {
      id: "heat", title: "Extreme heat", sub: "Phoenix summer, power or AC out", icon: "sun",
      trigger: "A National Weather Service heat warning, or the house is heating up with no AC.",
      leave: [
        "Extreme-heat warning and an outage expected past 24 hours.",
        "Hot inside and anyone is an infant, over 65 or chronically ill.",
        "Any sign of heat exhaustion that isn't improving.",
        "Go early, in daylight, to a place you arranged in advance."
      ],
      phases: [
        { label: "Now", items: [
          { t: "Confirm where you would go", d: "Family on another grid, a hotel, a cooler town. Public cooling centers hold only a small share of the city." },
          { t: "Cut heat gain", d: "Close blinds and curtains on sun-facing windows. Reflective covers if you have them." },
          { t: "Live in the coolest room", d: "Lowest, most interior room. No oven. No hard work at midday." },
          { t: "Drink water regularly", d: "Don't wait until you are thirsty.", s: "cdcoa" },
          { t: "Check everyone twice a day", d: "Especially infants, anyone over 65 and anyone chronically ill.", s: "cdcoa" },
          { t: "Never leave anyone in a parked car", d: "Children and pets included.", s: "cdckc" }
        ]},
        { label: "If it keeps getting hotter", items: [
          { t: "Above 90°F indoors, fans can make it worse", d: "A fan can raise body temperature then. Use cool showers or baths and wet cloths.", s: "cdcab" },
          { t: "Batteries can't run air conditioning", d: "Save the power station for phones, lights, radios and medical devices." },
          { t: "Car AC as a short refuge", d: "Parked outdoors only. Never in a garage.", s: "cpsc" }
        ]},
        { label: "Know the signs", items: [
          { t: "Heat exhaustion", d: "Heavy sweating; cold, pale, clammy skin; fast weak pulse; nausea; cramps; tiredness; dizziness; headache; fainting. Move somewhere cooler, loosen clothes, cool wet cloths, sip water. Get help if they vomit, get worse, or it lasts over 1 hour.", s: "cdcillness" },
          { t: "Heat stroke: 911", d: "103°F or higher; hot, red, dry or damp skin; fast strong pulse; confusion; passing out. Any confusion counts. Call 911 and cool them now.", s: "cdcillness", card: "heatstroke" }
        ]}
      ],
      sources: ["cdcillness", "cdcoa", "cdckc", "cdcab", "cpsc"]
    },
    { id: "storm", title: "Monsoon and dust storm", sub: "Coming in v1.1", icon: "wind", soon: true },
    { id: "smoke", title: "Wildfire smoke or evacuation", sub: "Coming in v1.1", icon: "flame", soon: true },
    { id: "boil", title: "Boil-water notice", sub: "Coming in v1.1", icon: "drop", soon: true }
  ],

  refs: {
    cdcfood: { n: "CDC: keep food safe after an emergency", u: "https://www.cdc.gov/food-safety/foods/keep-food-safe-after-emergency.html" },
    usda: { n: "USDA FSIS: how temperatures affect food", u: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/how-temperatures-affect-food" },
    co: { n: "CDC: avoiding carbon monoxide poisoning", u: "https://www.cdc.gov/natural-disasters/psa-toolkit/avoiding-carbon-monoxide-poisoning.html" },
    cpsc: { n: "CPSC: carbon monoxide questions and answers", u: "https://www.cpsc.gov/Safety-Education/Safety-Education-Centers/Carbon-Monoxide-Information-Center/Carbon-Monoxide-Questions-and-Answers" },
    cdcpo: { n: "CDC: what to do during a power outage", u: "https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-during-a-power-outage.html" },
    fcc: { n: "FCC and FEMA: communicating in an emergency", u: "https://www.fcc.gov/reports-research/guides/tips-communicating-emergency" },
    fema: { n: "FEMA: be prepared for a power outage", u: "https://www.ready.gov/sites/default/files/2024-03/ready.gov_power-outage_hazard-info-sheet.pdf" },
    readywater: { n: "Ready.gov: water", u: "https://www.ready.gov/water" },
    cdcoa: { n: "CDC: heat and older adults", u: "https://www.cdc.gov/heat-health/risk-factors/heat-and-older-adults-aged-65.html" },
    cdckc: { n: "CDC: keeping cool in a heat wave", u: "https://www.cdc.gov/natural-disasters/psa-toolkit/keeping-cool-in-a-heat-wave.html" },
    cdcab: { n: "CDC: about heat and your health (fans)", u: "https://www.cdc.gov/heat-health/about/index.html" },
    cdcillness: { n: "CDC: heat-related illness", u: "https://www.cdc.gov/disasters/extremeheat/pdf/Heat_Related_Illness.pdf" }
  }
};
if (typeof module !== "undefined") module.exports = HAVYN_CONTENT;
