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
    },
    {
      id: "drowning", title: "Drowning", sub: "Pulled from a pool or water, not breathing normally", icon: "wave",
      steps: [
        { t: "Get them out safely", d: "Reach or throw something that floats; don't jump in unless you're trained. Shout for help. Call 911 on speaker, or have someone call." },
        { t: "Tap and shout. Breathing normally?", d: "Look at the chest for up to 10 seconds. Gasping is not normal breathing." },
        { t: "Not breathing normally: 2 rescue breaths first", d: "Tilt the head back, lift the chin, pinch the nose, seal your mouth over theirs. 1 second each, enough to make the chest rise. Baby: cover the nose and mouth with your mouth. Not trained or can't give breaths? Skip to pushes." },
        { t: "Then CPR: 30 pushes, 2 breaths", d: "Hard and fast in the center of the chest. Keep going until they breathe or help takes over. If you can't give breaths, push anyway.", beat: 110, link: "cpr" },
        { t: "AED as soon as one arrives", d: "Quickly wipe the chest dry, put the pads on, follow its voice. Keep CPR going until it's ready." },
        { t: "Breathing again: on their side, then the ER", d: "Anyone who needed breaths or CPR after being in the water needs a hospital check, even if they seem fine." }
      ],
      note: "Child CPR depth and hand position are on the CPR child card.", noteLink: "cprchild",
      sources: [
        { n: "AHA: CPR with rescue breaths vital after drowning (2024)", u: "https://www.heart.org/en/news/2024/11/12/cpr-with-rescue-breaths-vital-to-resuscitation-after-drowning" },
        { n: "AHA 2025: special circumstances of resuscitation (drowning)", u: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-and-pediatric-special-circumstances-of-resuscitation" },
        { n: "Red Cross: drowning resuscitation guidelines", u: "https://guidelines.redcross.org/guidelines-database/drowning-process-resuscitation/" },
        { n: "AAP (HealthyChildren): CPR for drowning, updated guidance", u: "https://www.healthychildren.org/English/news/Pages/cpr-for-drowning-updated-guidance.aspx" }
      ]
    },
    {
      id: "overdose", title: "Opioid overdose", sub: "Won't wake up, slow or no breathing", icon: "pill",
      steps: [
        { t: "Shout their name and rub the breastbone hard", d: "Signs: won't wake up, slow or no breathing, blue or gray lips, tiny pupils, gurgling." },
        { t: "Call 911 now", d: "Put it on speaker. Say someone won't wake up and isn't breathing normally." },
        { t: "Give naloxone (Narcan)", d: "Nasal spray: tip in one nostril, press the plunger all the way. Don't wait to be sure it's opioids." },
        { t: "Not breathing normally: start CPR with breaths", d: "30 pushes, 2 breaths. Can't give breaths? Keep pushing.", beat: 110, link: "cpr" },
        { t: "No change in 2 to 3 minutes: give a second dose", d: "New device, other nostril. Keep up CPR in between." },
        { t: "Breathing again: on their side, stay with them", d: "Naloxone can wear off before the drugs do, and breathing can stop again. They still need the ER." }
      ],
      sources: [
        { n: "AHA and Red Cross: 2024 Guidelines for First Aid", u: "https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines" },
        { n: "CDC: 5 things to know about naloxone", u: "https://www.cdc.gov/overdose-prevention/reversing-overdose/about-naloxone.html" },
        { n: "CDC/NIOSH: using naloxone to reverse opioid overdose", u: "https://stacks.cdc.gov/view/cdc/77297/cdc_77297_DS1.pdf" },
        { n: "Washington State DOH: naloxone", u: "https://doh.wa.gov/node/5308" }
      ]
    },
    {
      id: "asthma", title: "Asthma attack", sub: "Wheezing, can't catch their breath", icon: "lungs",
      steps: [
        { t: "After a sting, food or medicine? Epinephrine first", d: "Sudden trouble breathing then may be anaphylaxis.", link: "anaphylaxis" },
        { t: "Sit them upright and stay with them", d: "Keep them calm. Loosen anything tight around the chest or neck." },
        { t: "Help them use their rescue inhaler", d: "Their own quick-relief inhaler, with a spacer if they have one, as their asthma action plan says. No inhaler? Call 911." },
        { t: "Call 911 for any danger sign", d: "Lips or nails blue or gray, struggling to breathe (hunched over, ribs showing), can't walk or talk well, very sleepy or confused, or the inhaler isn't helping." },
        { t: "Keep using the inhaler as their plan says, or as 911 tells you" },
        { t: "Won't wake up and not breathing normally: start CPR", link: "cpr" }
      ],
      sources: [
        { n: "American Lung Association: first aid for asthma", u: "https://www.lung.org/getmedia/8d0df46c-de43-46a9-b884-21aca244acee/first-aid-for-asthma.pdf" },
        { n: "AHA and Red Cross: 2024 Guidelines for First Aid", u: "https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines" }
      ]
    },
    {
      id: "lowsugar", title: "Low blood sugar", sub: "Diabetes: shaky, sweaty, confused", icon: "candy",
      steps: [
        { t: "Passed out, seizing or can't swallow? Nothing by mouth", d: "Food or drink can choke them. Call 911 now." },
        { t: "Give their glucagon if they have it", d: "Follow the kit. Turn them on their side; they may throw up. Not awake in 15 minutes: a second dose if you have one." },
        { t: "Awake and can swallow? 15 grams of fast sugar", d: "Glucose tablets or gel (check the label for 15 g), 1/2 cup of juice or regular soda, or 1 tablespoon of sugar or honey." },
        { t: "Wait 15 minutes, then check again", d: "Still low, or the meter reads under 70: another 15 grams. No better, or worse: call 911." },
        { t: "Back to normal: eat a meal or snack", d: "Not mealtime? Protein and carbs, like cheese and crackers." },
        { t: "Never give insulin to someone who is low", d: "It drives the sugar even lower." }
      ],
      sources: [
        { n: "ADA: what to know with a low (2025)", u: "https://professional.diabetes.org/sites/dpro/files/2025-10/xeris-severe-hypoglycemia-what-to-know-with-a-low-patient-7-14-25-002.pdf" },
        { n: "ADA: hypoglycemia (low blood glucose)", u: "https://diabetes.org/living-with-diabetes/hypoglycemia-low-blood-glucose" },
        { n: "AHA and Red Cross: 2024 Guidelines for First Aid", u: "https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines" }
      ]
    },
    {
      id: "scorpion", title: "Scorpion sting", sub: "Bark scorpion: pain, tingling, numbness", icon: "bug",
      steps: [
        { t: "Call Poison Control", d: "1-800-222-1222, free and open 24/7. Most stings are handled safely at home with their help. Children are at higher risk: call right away.", call: { n: "Poison Control", num: "1-800-222-1222" } },
        { t: "Call 911 for trouble breathing", d: "Also chest pain, swelling of the face or throat, or hives.", link: "anaphylaxis" },
        { t: "Serious signs at any age: call 911", d: "Wild or jerky eye movements, drooling, trouble swallowing or talking, twitching, nonstop crying in a child. Antivenom is given in the hospital." },
        { t: "Wash it and cool it", d: "Soap and water, then a cool compress, not ice. Rest the arm or leg in a comfortable position." },
        { t: "Kill the scorpion; don't try to catch it", d: "Knowing the type doesn't change the care." }
      ],
      note: "Pain, tingling and numbness usually start easing within a few hours.",
      sources: [
        { n: "Banner Poison and Drug Information Center: FAQ", u: "https://bannerhealth.com/services/poison-drug-information/support/frequently-asked-questions" },
        { n: "Banner: bark scorpions", u: "https://www.bannerhealth.com/services/poison-drug-information/desert-critters/bark-scorpions" },
        { n: "Banner: what not to do if stung or bitten", u: "https://www.bannerhealth.com/healthcareblog/teach-me/scorpions-to-snakes-heres-what-not-to-do-if-stung-or-bitten" },
        { n: "Arizona Poison and Drug Information Center: scorpions", u: "https://azpoison.com/node/80" }
      ]
    },
    {
      id: "snake", title: "Rattlesnake bite", sub: "Every bite goes to the ER", icon: "snake",
      steps: [
        { t: "Move away from the snake", d: "Don't try to catch or kill it, and don't touch it even if it looks dead." },
        { t: "Call 911", d: "Every bite needs the emergency room; antivenom is given there. Poison Control (1-800-222-1222) can help too." },
        { t: "Keep them calm and still", d: "Walk only if needed to get help or a signal." },
        { t: "Keep the bitten arm or leg still, at heart level or a little lower" },
        { t: "Take off rings, watches, shoes and tight clothing on that limb", d: "Swelling can come fast." },
        { t: "Don't: tourniquet, ice, cutting or sucking", d: "No tight bands, ice or ice water, cutting, suction, alcohol or medicines. They don't help and can make it worse." }
      ],
      sources: [
        { n: "Banner Poison and Drug Information Center: rattlesnake bites", u: "https://www.bannerhealth.com/services/poison-drug-information/desert-critters/rattlesnakes" },
        { n: "Arizona Poison and Drug Information Center: rattlesnake bite card", u: "https://azpoison.com/sites/default/files/rattlesnake_bite_info_card_english.pdf" },
        { n: "Arizona Poison and Drug Information Center: rattlesnakes", u: "https://azpoison.com/venom/rattlesnakes" },
        { n: "Poison Control: rattlesnake bites", u: "https://www.poison.org/articles/rattlesnakes" }
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
    {
      id: "storm", title: "Monsoon and dust storm", sub: "Dust walls, flash floods, lightning, outages", icon: "wind",
      trigger: "A dust storm or flash flood warning, or a monsoon storm on the way (mostly June to September).",
      leave: ["Officials say GO for your area.", "Water is rising toward the house: get to higher ground by a dry route.", "Trapped? Get to the highest point, not a closed attic, and call 911.", "Never leave by driving or walking into floodwater."],
      sources: ["adot", "nwsflood", "nwsflooddur", "readyfloods", "nwslightning", "srp", "tep", "maricopa"],
      phases: [
        { label: "Before it hits", items: [
          { t: "Charge phones, power banks and the station", d: "Storms often knock the power out.", go: "blackout" },
          { t: "Don't drive into a dust storm", d: "At home, wait it out. On the road, exit or pull completely off the pavement before it reaches you.", s: "adot" }
        ] },
        { label: "Driving in dust: Pull Aside, Stay Alive", items: [
          { t: "Check traffic around you and slow down", s: "adot" },
          { t: "Exit the highway if you can, or pull completely off the pavement", d: "Do it before visibility drops. Don't stop in a travel lane or the emergency lane.", s: "adot" },
          { t: "Turn off all lights, flashers included", d: "Cars behind you can follow your lights and crash into you.", s: "adot" },
          { t: "Set the parking brake and take your foot off the brake pedal", s: "adot" },
          { t: "Stay in the car, buckled, until the storm passes", s: "adot" }
        ] },
        { label: "Flash floods", items: [
          { t: "Turn around, don't drown", d: "Never drive or walk into floodwater or around barricades. 6 inches of fast water can knock an adult over; 12 inches can carry away most cars; 18 to 24 inches, most SUVs and trucks.", s: "nwsflood" },
          { t: "Get to higher ground and stay out of washes", s: "nwsflooddur" },
          { t: "Car stuck in moving water: stay inside", d: "Water rising inside? Get on the roof and call 911.", s: "readyfloods" }
        ] },
        { label: "Lightning", items: [
          { t: "When thunder roars, go indoors", d: "A building with wiring and plumbing, or a hard-topped car with the windows up. Not a patio, shed or tent.", s: "nwslightning" },
          { t: "Stay in until 30 minutes after the last thunder", s: "nwslightning" }
        ] },
        { label: "If the power goes out", items: [
          { t: "Keep away from fallen power lines", d: "Treat every line as live. Call 911, then your electric company (numbers are in Comms).", s: "srp", href: "#/comms" },
          { t: "Power line on your car: stay inside", d: "Call 911 and keep others away. If the car catches fire, jump clear without touching the car and the ground at the same time, land with feet together and shuffle away.", s: "tep" },
          { t: "Turn off lights and appliances", d: "Avoids a surge when the power comes back.", s: "srp" },
          { t: "Run the blackout playbook", go: "blackout", act: "outage-start" }
        ] }
      ]
    },
    {
      id: "smoke", title: "Wildfire smoke or evacuation", sub: "Clean air inside; Ready, Set, Go to leave", icon: "flame",
      trigger: "Smoke in the air, an air-quality alert, or a fire near you with READY, SET or GO notices.",
      leave: ["GO is announced for your area: leave right away, with the pets.", "Danger is close and life-threatening, with or without an order.", "Smoke is making someone's breathing hard and you can't keep a clean room: move somewhere with clean air."],
      sources: ["azein", "maricopa", "mcnotify", "epasmoke", "epasmoke2", "epaheatsmoke", "epacleanroom", "epadiy", "epalungs", "cdcsmokeheart"],
      phases: [
        { label: "READY: now", items: [
          { t: "Sign up for Maricopa County alerts", d: "RAVE Alerts at smart911.com, plus the Ready Maricopa app. Evacuation alerts say READY, SET or GO.", s: "mcnotify" },
          { t: "Pack a go-bag for each person", d: "Medicines, papers, chargers, water and 3 days of food, cash, pet supplies, and the binder.", s: "azein", href: "#/binder" },
          { t: "Keep NIOSH N95 masks and a HEPA air cleaner", d: "Dust masks, bandanas and cloth masks don't stop smoke.", s: "epasmoke" }
        ] },
        { label: "Smoke: protect your lungs", items: [
          { t: "Stay inside with windows and doors closed", d: "Close the AC's fresh-air intake or set it to recirculate, and run a swamp cooler as little as you can. Take it easy: less activity means less smoke breathed in. Too hot? Heat comes first.", s: "epaheatsmoke", go: "heat" },
          { t: "Make a clean room", d: "A bedroom with few windows and no fireplace, with a HEPA air cleaner sized for the room that makes no ozone. Stopgap: a MERV 13 filter on a 2012-or-newer box fan. Older fans can catch fire: never run one unattended or while you sleep.", s: "epacleanroom" },
          { t: "Don't add smoke indoors", d: "No candles, frying or broiling, smoking or vacuuming.", s: "epasmoke" },
          { t: "Outside, wear a fitted N95", d: "It must say NIOSH. Both straps on, nose clip pinched; it only helps if it seals. Beards break the seal, and none fit young kids. Heart or lung problems, or pregnant? Ask a doctor. Dizzy? Get to cleaner air and take it off.", s: "epalungs" },
          { t: "In the car, set the AC to recirculate", s: "epasmoke2" },
          { t: "Chest pain or severe trouble breathing: call 911", d: "Other trouble breathing or a cough that won't stop: call your doctor. People with heart or lung disease are at higher risk.", s: "cdcsmokeheart" }
        ] },
        { label: "SET: be ready to leave", items: [
          { t: "Go-bags, medicines and the binder by the door", d: "Be ready to leave the moment you're told.", s: "maricopa" },
          { t: "Text your out-of-area contact the plan", href: "#/comms" }
        ] },
        { label: "GO: leave", items: [
          { t: "Leave right away with everyone and the pets", s: "maricopa" },
          { t: "Follow instructions from emergency crews and their routes", s: "azein" },
          { t: "Text \"OK + location\" once you're out", href: "#/comms" }
        ] }
      ]
    },
    {
      id: "boil", title: "Boil-water notice", sub: "Tap water isn't safe to drink until boiled", icon: "drop",
      trigger: "Your water provider or the city issues a boil-water advisory.",
      ruleTitle: "Hard rule until the notice is lifted",
      leave: ["Only bottled or boiled water for drinking, cooking, ice, brushing teeth, baby formula and pets.", "Home water filters don't make it safe: most don't remove bacteria or viruses."],
      sources: ["cdcboil", "cdcwater", "cdcstore", "ctflush"],
      phases: [
        { label: "Make water safe", items: [
          { t: "Check the notice type", d: "\"Do not drink\" or \"Do not use\" means boiling won't help: use bottled or stored water.", s: "cdcboil" },
          { t: "Boil: a rolling boil for 1 full minute, then let it cool", d: "Store it in clean, covered containers. Above 6,500 feet (Flagstaff, not Phoenix), boil 3 minutes.", s: "cdcwater" },
          { t: "Can't boil? Use unscented bleach", d: "Check the label: 5% to 9%. 8 drops (just under 1/8 teaspoon) per gallon of clear water. Cloudy? Filter it or let it settle first, then use 16 drops. Stir and wait at least 30 minutes. Boiling kills more germs.", s: "cdcwater" },
          { t: "Water you stored before the problem began can be used", d: "Your drums and bricks, if sealed and filled within the last 6 months. Unsure? Boil or treat it.", s: "cdcstore" }
        ] },
        { label: "Around the house", items: [
          { t: "Food and drinks", d: "Wash produce and make coffee, tea and formula with boiled or bottled water; ready-to-use formula is best. Throw out ice made from tap water, and don't use the fridge's water or ice dispenser.", s: "cdcboil" },
          { t: "Dishes", d: "By hand: wash and rinse, then soak 1 minute in 1 teaspoon of unscented bleach per gallon of warm water, and air-dry. A dishwasher is fine if it has a sanitizing cycle.", s: "cdcboil" },
          { t: "Bathing", d: "Showers are fine; don't swallow the water. Give babies and young children a sponge bath.", s: "cdcboil" },
          { t: "Handwashing and laundry", d: "Soap and tap water are fine for handwashing in most cases. Do laundry as usual.", s: "cdcboil" }
        ] },
        { label: "When the notice is lifted", items: [
          { t: "Flush the pipes", d: "Follow your water provider's steps. If they give none: run each cold tap 5 minutes, throw out 3 batches of ice, and replace fridge and faucet filters.", s: "ctflush" }
        ] }
      ]
    }
  ],

  // ---------------- v1.1: missions (from the mission map) ----------------
  missions: {
    phases: [
      { id: "today", label: "Today", when: "Nov 14 · $0", gate: "Airplane-mode test passes", gateD: "Every phone in airplane mode opens HAVYN, an emergency card, WikiMed and a map.", tasks: [
        { id: "m-downloads", t: "Start the big downloads on Wi-Fi", d: "Kiwix with WikiMed. Apple Maps offline (iOS 17 or later): Maps → your picture → Offline Maps → Download New Map; cover Phoenix and the route to your out-of-area address. Leave the phones plugged in." },
        { id: "m-plan", t: "Family plan: out-of-area contact and 3 meeting places", go: "#/family/plan" },
        { id: "m-medid", t: "Medical ID on every phone", d: "Health app → your picture → Medical ID → Edit. Turn on Show When Locked and add emergency contacts." },
        { id: "m-sat", t: "Satellite demo outside (iPhone 14 and newer)", d: "Settings → Emergency SOS → Try Demo, under open sky." },
        { id: "m-planpdf", t: "Plan PDF on every phone; print 2 copies", d: "Import it into the Library so it opens inside HAVYN.", go: "#/library" }
      ] },
      { id: "week", label: "This week", when: "by Nov 21", gate: "HAVYN on every phone, safety floor ordered", tasks: [
        { id: "m-install", t: "Install HAVYN on every phone", d: "Safari → Share → Add to Home Screen, then open it once while online." },
        { id: "m-enter", t: "Enter family and supplies; save a Memory Card", go: "#/family" },
        { id: "m-household", t: "Add every person and pet so the buy list sizes itself", d: "Note any powered medical device or refrigerated medicine on that person's page.", go: "#/buy" },
        { id: "m-floor", t: "Order the safety floor (about $565)", d: "Two water drums, a filter and bleach, three CO alarms, two power banks, the weather radio, one genuine tourniquet.", go: "#/buy?f=floor" },
        { id: "m-review", t: "EMT or nurse reviews the 10 cards", d: "Their sign-off replaces \"Awaiting EMT or nurse review\".", go: "#/emergency" }
      ] },
      { id: "bf", label: "Black Friday", when: "Nov 27–30", gate: "Power, radios and drives ordered", tasks: [
        { id: "m-power", t: "1 kWh LiFePO4 power station + 200 W solar", go: "#/buy?f=bf" },
        { id: "m-mesh", t: "Meshtastic radios (T1000-E)", go: "#/buy?f=bf" },
        { id: "m-gmrs", t: "GMRS radios + $35 license", d: "Apply online with the FCC. No exam; the holder must be 18 or older.", go: "#/buy?f=bf" },
        { id: "m-vault", t: "Vault drives: 1 TB SSD + 2 TB HDD", go: "#/buy?f=bf" }
      ] },
      { id: "dec", label: "December", when: "", gate: "Anyone finds any card in under 10 seconds", tasks: [
        { id: "m-library", t: "Load manuals and guides into the Library", d: "Power station and radio manuals, the plan PDF, a first-aid book.", go: "#/library" },
        { id: "m-binder", t: "Print the binder", d: "Make the binder PDF in HAVYN, print two copies, and keep them in sheet protectors.", go: "#/binder" },
        { id: "m-class", t: "CPR + Stop the Bleed class" },
        { id: "m-drill", t: "First lights-out drill", d: "Two hours with phones in airplane mode: everyone finds three cards, the radios and the rally point." }
      ] },
      { id: "jan", label: "January–February", when: "hub + vault", gate: "Every phone browses the hub offline", tasks: [
        { id: "m-hub", t: "Hub: Raspberry Pi 5 or an old laptop running Kiwix" },
        { id: "m-vaultsync", t: "Vault: two drives, synced, with checksums" },
        { id: "m-tier3", t: "Tier 3: 2 kWh station, extinguishers, camp stove", go: "#/buy?f=d90" }
      ] },
      { id: "may", label: "Before May", when: "heat season", gate: "Drill run, destination confirmed", tasks: [
        { id: "m-dest", t: "Confirm where you'd go if heat forces you out", go: "#/family/plan" },
        { id: "m-cool", t: "Window covers, battery fans, car AC service" },
        { id: "m-heatdrill", t: "Heat drill: run the leave-now rule", go: "#/playbooks/heat" },
        { id: "m-ai", t: "Optional: AI librarian on the hub" }
      ] }
    ],
    // Upkeep from the plan's maintenance schedule. every = days, or "spring" (due from March 1 each year).
    recurring: [
      { id: "r-month", t: "Monthly check", time: "15 min", every: 30, d: "Top up and test the power station and power banks. Press-test the CO alarms. Open HAVYN on every phone and clear the expiry list." },
      { id: "r-quarter", t: "Quarterly drill", time: "1–2 h", every: 91, d: "Two hours of lights out: airplane mode, everyone finds three cards, the radios and the rally point. Sync both vault drives and verify checksums. Check for newer archive versions." },
      { id: "r-spring", t: "Spring, before the heat", time: "2 h", every: "spring", d: "Confirm the evacuation destination. Service the car's AC. Switch to heat mode (2 gal per person a day) and close the gap. Check window covers and battery fans." },
      { id: "r-year", t: "Yearly review", time: "Half a day", every: 365, d: "Update the plan, contacts and medical details. Replace stored bleach and alarm batteries. Reprint the binder. Book CPR and bleeding-control refreshers." }
    ]
  },

  // ---------------- v1.1: buy list (from the Blackout Prep Buy List, Nov 14 2026) ----------------
  // q: a number, null (no fixed quantity), or a rule sized from the household:
  //   drum = 14 days at 2 gal per person a day (+ pets) in 55-gal drums · brick = 3 days at 1 gal per person in 3.5-gal bricks
  //   P = one per person · P+1 = one per person plus a base · P/2 = pairs · AT = each teen and adult
  // floor = quantity in the "first $565" safety floor. add = how a bought item enters Supplies.
  buy: {
    checked: "2026-11-14",
    dates: [{ n: "Black Friday", d: "2026-11-27" }, { n: "Cyber Monday", d: "2026-11-30" }],
    tiers: [
      { id: "week", label: "This week" }, { id: "bf", label: "Black Friday" },
      { id: "d90", label: "Next 90 days" }, { id: "opt", label: "Optional" }
    ],
    rules: [
      "Check price history (Keepa or camelcamelcamel) and buy at or near the 90-day low. Ignore inflated \"was\" prices.",
      "Never buy safety gear on price. Tourniquets and trauma supplies only from the maker or an authorized dealer.",
      "Power stations: LiFePO4, a major brand, solar and car charging, and a warranty you can actually use.",
      "Storage is expensive in 2026. Buy the capacity this plan needs: hard drive at home, SSD in the go-bag.",
      "Rows are in buying order. Quantities follow the people and pets on the Family screen."
    ],
    items: [
      { id: "drum", tier: "week", n: "Water storage, home", pick: "55-gal BPA-free drum kit with pump (Augason Farms or WaterPrepared)", q: "drum", price: 120, target: 100, floor: 2, why: "14 days at heat-mode 2 gal per person per day. Keep indoors, out of the sun.", u: "https://www.amazon.com/s?k=55+gallon+water+storage+barrel+kit+pump", note: "Estimate", add: { cat: "water", per: 55, name: "55-gal drum" } },
      { id: "brick", tier: "week", n: "Water storage, portable", pick: "WaterBrick 3.5 gal stackable (or Reliance Aqua-Tainer 7 gal)", q: "brick", price: 21, target: 19, why: "3 days on the move at 1 gal per person per day; fits in a car.", u: "https://www.amazon.com/s?k=WaterBrick+3.5+gallon", note: "Walmart: about $19–21 each in 6–10 packs, Nov 2026", add: { cat: "water", per: 3.5, name: "WaterBrick 3.5 gal" } },
      { id: "filter", tier: "week", n: "Water filter", pick: "Sawyer Squeeze SP129", q: 2, price: 31, target: 30, floor: 1, why: "Removes bacteria and protozoa, not viruses, chemicals or salt. Pair with bleach or tablets; pool water is for flushing only.", u: "https://www.amazon.com/s?k=Sawyer+Squeeze+SP129", note: "Amazon deal $31 (Oct 2026); list $45.99", add: { cat: "gear", name: "Sawyer Squeeze filter" } },
      { id: "bleach", tier: "week", n: "Water disinfection", pick: "Unscented household bleach + Katadyn Micropur MP1 tablets", q: 1, price: 20, target: 15, floor: 1, why: "Kills viruses. Check the bleach strength on the label; replace yearly.", u: "https://www.amazon.com/s?k=Katadyn+Micropur+MP1", note: "Estimate", add: { cat: "gear", name: "Bleach + Micropur tablets" } },
      { id: "waterbob", tier: "week", n: "Bathtub water bladder", pick: "waterBOB 100 gal", q: 1, price: 35, target: 30, why: "Fill it when an outage is forecast; for flushing and washing.", u: "https://www.amazon.com/s?k=waterBOB+bathtub", note: "Estimate", add: { cat: "gear", name: "waterBOB (fill before an outage)" } },
      { id: "co", tier: "week", n: "CO alarms, battery", pick: "First Alert CO250B or Kidde 9CO5-LP3", q: 3, price: 25, target: 23, floor: 3, why: "One near each sleeping area. Generators and grills kill quietly.", u: "https://www.amazon.com/s?k=battery+carbon+monoxide+alarm", note: "Walmart $23–29, Nov 2026", add: { cat: "gear", name: "CO alarm (battery)" } },
      { id: "bank", tier: "week", n: "Power banks", pick: "20,000 mAh USB-C PD (Anker or similar)", q: "P", price: 45, target: 35, floor: 2, why: "About 3–4 phone charges each.", u: "https://www.amazon.com/s?k=20000mAh+power+bank+USB-C+PD", note: "Estimate", add: { cat: "power", per: 74, name: "Power bank 20,000 mAh" } },
      { id: "headlamp", tier: "week", n: "Headlamps", pick: "Rechargeable, with AAA backup", q: "P", price: 30, target: 25, why: "Hands-free light; no candles.", u: "https://www.amazon.com/s?k=rechargeable+headlamp", note: "Estimate", add: { cat: "gear", name: "Headlamp" } },
      { id: "lantern", tier: "week", n: "Lanterns", pick: "Rechargeable or solar LED", q: 2, price: 30, target: 25, why: "Room light without fire risk.", u: "https://www.amazon.com/s?k=rechargeable+LED+lantern", note: "Estimate", add: { cat: "gear", name: "LED lantern" } },
      { id: "batt", tier: "week", n: "Batteries (packs)", pick: "AA and AAA lithium, long shelf life", q: 2, price: 20, target: 16, why: "Radios, lights, alarms.", u: "https://www.amazon.com/s?k=Energizer+Ultimate+Lithium+AA", note: "Estimate", add: { cat: "gear", name: "Lithium AA/AAA packs" } },
      { id: "radio", tier: "week", n: "Weather radio", pick: "Midland ER310 (crank, solar, AA; NOAA alerts)", q: 1, price: 75, target: 45, floor: 1, why: "News and alerts with no network.", u: "https://www.amazon.com/s?k=Midland+ER310", note: "REI $80, Sportsman's $69.99; Amazon hit $25.63 in Sep 2026", add: { cat: "gear", name: "Weather radio (Midland ER310)" } },
      { id: "tq", tier: "week", n: "Tourniquets", pick: "CAT Gen 7, genuine only", q: 3, price: 33, target: 30, floor: 1, why: "Severe bleeding. Under $20 is a red flag for a fake: buy from the maker or an authorized dealer.", u: "https://www.narescue.com/", uName: "North American Rescue", note: "Genuine $25–39 (Tactical Medical Solutions)", add: { cat: "gear", name: "Tourniquet (CAT Gen 7)" } },
      { id: "bleedkit", tier: "week", n: "Bleeding-control kit", pick: "Hemostatic gauze, compression bandage, chest seal, shears, gloves", q: 1, price: 70, target: 60, why: "Pairs with the tourniquets. Same counterfeit rule applies.", u: "https://www.narescue.com/", uName: "North American Rescue", note: "Estimate", add: { cat: "gear", name: "Bleeding-control kit" } },
      { id: "firstaid", tier: "week", n: "First aid kit", pick: "Family-size kit + digital thermometer + pulse oximeter", q: 1, price: 60, target: 50, why: "Everyday injuries and fevers.", u: "https://www.amazon.com/s?k=family+first+aid+kit", note: "Estimate", add: { cat: "gear", name: "First aid kit" } },
      { id: "ors", tier: "week", n: "Oral rehydration salts", pick: "WHO-formula ORS packets", q: 30, price: 1, target: 0.8, why: "Heat illness and diarrhea.", u: "https://www.amazon.com/s?k=oral+rehydration+salts+WHO+formula", note: "Estimate", add: { cat: "gear", name: "ORS packets" } },
      { id: "opener", tier: "week", n: "Manual can openers", pick: "Heavy-duty", q: 2, price: 12, target: 10, why: "The classic failure point.", u: "https://www.amazon.com/s?k=manual+can+opener+heavy+duty", note: "Estimate", add: { cat: "gear", name: "Manual can opener" } },
      { id: "food", tier: "week", n: "Food, 2 weeks (per person)", pick: "Shelf-stable food you already eat, about 28,000 kcal per person", q: "P", price: 70, target: 70, why: "Rotate into normal meals and replace as you use it.", note: "Estimate", add: { cat: "food", per: 28000, name: "Shelf-stable food, 2 weeks per person" } },
      { id: "sanit", tier: "week", n: "Sanitation kit", pick: "5-gal bucket + toilet seat lid + heavy bags + cat litter", q: 1, price: 45, target: 40, why: "A toilet when water or sewer fails.", u: "https://www.amazon.com/s?k=5+gallon+bucket+toilet+seat+lid", note: "Estimate", add: { cat: "gear", name: "Sanitation kit" } },
      { id: "n95", tier: "week", n: "N95 masks", pick: "NIOSH-approved, box of 20", q: 1, price: 20, target: 15, why: "Dust storms and wildfire smoke.", u: "https://www.amazon.com/s?k=NIOSH+N95+mask+20+pack", note: "Estimate", add: { cat: "gear", name: "N95 masks (box of 20)" } },
      { id: "cool", tier: "week", n: "Cooling kit", pick: "Battery fans + cooling towels + spray bottles + reflective window covers + instant cold packs", q: 1, price: 80, target: 60, why: "Heat without AC. Above 90°F indoors a dry fan can raise body temperature; wet skin plus moving air helps.", u: "https://www.amazon.com/s?k=battery+operated+fan", note: "Estimate", add: { cat: "gear", name: "Cooling kit" } },
      { id: "binder", tier: "week", n: "Printed binder", pick: "Binder, sheet protectors, waterproof pouches", q: 1, price: 25, target: 20, why: "The paper layer.", note: "Estimate", add: { cat: "gear", name: "Printed binder" } },
      { id: "cash", tier: "week", n: "Cash", pick: "Small bills; amount is your call", q: null, price: null, why: "Card readers and ATMs fail with the grid." },
      { id: "station", tier: "bf", n: "Power station, about 1 kWh", pick: "LiFePO4: EcoFlow DELTA 3 Classic or Anker SOLIX C1000", q: 1, price: 480, target: 450, why: "Phones, lights, radios, a fan, the hub.", u: "https://www.amazon.com/s?k=EcoFlow+DELTA+3+Classic", note: "EcoFlow $462 (early Black Friday); Anker $499.99 (Oct 27, 2026)", add: { cat: "power", per: 1024, name: "1 kWh power station" } },
      { id: "solar", tier: "bf", n: "Solar panel, 200 W", pick: "Renogy 200W, Anker SOLIX PS200 or EcoFlow 220W", q: 1, price: 220, target: 200, why: "Refills the station most days in Phoenix.", u: "https://www.amazon.com/s?k=200W+portable+solar+panel", note: "Renogy about $200, Anker about $299 (2026 guides)", add: { solarW: 200 } },
      { id: "mesh", tier: "bf", n: "Meshtastic radios", pick: "SenseCAP T1000-E, one per person + one base", q: "P+1", price: 45, target: 40, why: "Family texting with no cell towers.", u: "https://www.amazon.com/s?k=SenseCAP+T1000-E+Meshtastic", note: "About $40–50 at US retailers (Maker Shed $42.99)", add: { cat: "gear", name: "Meshtastic radio (T1000-E)" } },
      { id: "gmrs", tier: "bf", n: "GMRS radios (pairs)", pick: "Midland GXT1000VP4", q: "P/2", price: 95, target: 85, why: "Voice backup when phones are dead or lost.", u: "https://www.amazon.com/s?k=Midland+GXT1000VP4", note: "REI $90; Ace $99.99 (2026)", add: { cat: "gear", name: "GMRS radio pair" } },
      { id: "gmrslic", tier: "bf", n: "GMRS license", pick: "FCC, 10 years, covers immediate family", q: 1, price: 35, target: 35, why: "Required to transmit on GMRS. No exam; the holder must be 18 or older. Apply online with the FCC.", note: "FCC fee $35" },
      { id: "ssd", tier: "bf", n: "Vault drive, go-bag", pick: "1 TB rugged USB-C SSD (Samsung T7 Shield or similar)", q: 1, price: 150, target: 130, why: "Shock-proof copy that travels.", u: "https://www.amazon.com/s?k=Samsung+T7+Shield+1TB", note: "2026 prices volatile: $130–288 seen", add: { cat: "gear", name: "Vault SSD 1 TB" } },
      { id: "hdd", tier: "bf", n: "Vault drive, home", pick: "2 TB portable hard drive (WD or Toshiba)", q: 1, price: 90, target: 75, why: "Cheap home copy of the full library.", u: "https://www.amazon.com/s?k=2TB+portable+hard+drive", note: "Walmart: Toshiba $74, WD $105 (Nov 2026)", add: { cat: "gear", name: "Vault HDD 2 TB" } },
      { id: "adapter", tier: "bf", n: "Lightning to USB 3 adapter", pick: "Apple camera adapter, only for iPhones before 15", q: 1, price: 39, target: 29, why: "Opens the vault drive on older iPhones.", u: "https://www.amazon.com/s?k=Apple+Lightning+to+USB+3+Camera+Adapter", note: "Estimate", add: { cat: "gear", name: "Lightning to USB 3 adapter" } },
      { id: "carchg", tier: "bf", n: "Car chargers", pick: "USB-C PD, 12 V", q: 2, price: 20, target: 15, why: "The car as a phone charger.", u: "https://www.amazon.com/s?k=USB-C+PD+car+charger", note: "Estimate", add: { cat: "gear", name: "USB-C car charger" } },
      { id: "hub", tier: "d90", n: "Hub computer", pick: "Raspberry Pi 5 4GB + power supply + case + SSD (or an old laptop for $0)", q: 1, price: 260, target: 200, why: "Serves the full library over its own Wi-Fi.", u: "https://www.amazon.com/s?k=Raspberry+Pi+5+4GB", note: "Pi 5 4GB $110 (Oct 2026); rest estimate", add: { cat: "gear", name: "Library hub" } },
      { id: "station2", tier: "d90", n: "Power station, about 2 kWh", pick: "Anker SOLIX S2000 or similar", q: 1, price: 700, target: 650, why: "Longer runtime; powers medical devices.", u: "https://www.amazon.com/s?k=Anker+SOLIX+S2000", note: "$699.99 on sale, Oct 2026", add: { cat: "power", per: 2010, name: "2 kWh power station" } },
      { id: "ext", tier: "d90", n: "Fire extinguishers", pick: "ABC, 5 lb", q: 2, price: 50, target: 40, why: "Kitchen and garage.", u: "https://www.amazon.com/s?k=ABC+fire+extinguisher+5+lb", note: "Estimate", add: { cat: "gear", name: "Fire extinguisher (ABC, 5 lb)" } },
      { id: "stove", tier: "d90", n: "Camp stove + fuel", pick: "Butane single burner + 8 canisters", q: 1, price: 60, target: 50, why: "Cooking without power. Outdoors only.", u: "https://www.amazon.com/s?k=butane+camp+stove", note: "Estimate", add: { cat: "gear", name: "Camp stove + butane" } },
      { id: "training", tier: "d90", n: "Training (per person)", pick: "CPR/AED/First Aid course for each adult and teen (Red Cross or AHA)", q: "AT", price: 100, target: 80, why: "Skills live in people, not apps.", note: "Estimate; varies by provider" },
      { id: "rx", tier: "d90", n: "Prescription buffer", pick: "30 extra days of daily meds (ask your doctor and insurer)", q: null, price: null, why: "Pharmacies close or run short.", add: { cat: "meds", name: "Prescription buffer" } },
      { id: "pouch", tier: "d90", n: "Document pouch", pick: "Fireproof, waterproof", q: 1, price: 30, target: 25, why: "Originals of IDs, deeds and insurance.", u: "https://www.amazon.com/s?k=fireproof+document+bag", note: "Estimate", add: { cat: "gear", name: "Document pouch" } },
      { id: "ereader", tier: "opt", n: "E-ink reader", pick: "Kindle Paperwhite or Kobo", q: 1, price: 150, target: 120, why: "Weeks of reading on one charge.", u: "https://www.amazon.com/s?k=Kindle+Paperwhite", note: "Estimate", add: { cat: "gear", name: "E-ink reader" } },
      { id: "faraday", tier: "opt", n: "Faraday bag", pick: "For a spare phone and the go-bag SSD", q: 1, price: 30, target: 25, why: "Cheap insurance against rare events.", u: "https://www.amazon.com/s?k=faraday+bag+phone", note: "Estimate", add: { cat: "gear", name: "Faraday bag" } },
      { id: "gen", tier: "opt", n: "Inverter generator", pick: "2–3 kW with automatic CO shutoff", q: 1, price: 900, target: 750, why: "Fridge, freezer, window AC. Outdoors, 20 ft from openings.", u: "https://www.amazon.com/s?k=inverter+generator+CO+shutoff", note: "Estimate", add: { cat: "gear", name: "Inverter generator" } },
      { id: "minipc", tier: "opt", n: "Mini PC for local AI", pick: "Ryzen 7, 32 GB RAM, 1 TB SSD", q: 1, price: 800, target: 650, why: "Runs the AI librarian on the hub.", note: "Estimate; memory prices up in 2026", add: { cat: "gear", name: "Mini PC" } },
      { id: "spare", tier: "opt", n: "Spare library phone", pick: "Older iPhone loaded with the full offline pack", q: 1, price: 150, target: 100, why: "Backup device, kept charged.", note: "Estimate", add: { cat: "gear", name: "Spare library phone" } }
    ]
  },

  // ---------------- v1.1: the plan (family-facing parts of the Offline Survival Plan) ----------------
  plan: {
    line: "Free setup today, gear this month, drilled by May.",
    stages: [
      { id: "today", t: "Today, $0, 2–3 hours", d: "Set up every iPhone (Medical ID, satellite demo), install the offline apps and archives, save the free manuals, print the family plan. Every phone is useful offline tonight." },
      { id: "week", t: "This week", d: "14 days of water at heat-mode rates, a filter and bleach, CO alarms, power banks, a weather radio, genuine tourniquets." },
      { id: "bf", t: "Black Friday, Nov 27–30", d: "A 1 kWh LiFePO4 power station, a 200 W solar panel, Meshtastic mesh radios, GMRS radios, vault drives." },
      { id: "then", t: "Then", d: "A home hub serving the whole library over its own Wi-Fi, two vault drives, an AI librarian, the family mesh." }
    ],
    power: [
      { n: "Power bank, one per person", cap: "20,000 mAh, about 74 Wh: roughly 3–4 iPhone charges (estimate)", runs: "A phone for several days on Low Power Mode" },
      { n: "Power station, about 1 kWh, LiFePO4", cap: "About 870 Wh usable", runs: "Phones, lights and radio for about 9 days (about 3 with the hub on), or one 40 W fan for about 20 hours" },
      { n: "Power station, about 2 kWh", cap: "About 1,700 Wh usable", runs: "Double the above" },
      { n: "Folding solar, 200–400 W", cap: "About 0.9–1.8 kWh a day at Phoenix's average sun (calculation)", runs: "Refills a 1 kWh station most days" },
      { n: "The car", cap: "12 V and USB; limited by fuel", runs: "Phone charging; its AC as a cooling refuge, parked outdoors only. Keep the tank at least half full." },
      { n: "Inverter generator (optional)", cap: "2–3 kW with automatic CO shutoff; limited by fuel", runs: "Fridge, freezer, a window AC. Only with CO alarms and the 20-ft rule." }
    ],
    powerRule: "Buy LiFePO4 from a major brand, with solar and car charging and a warranty you can actually use.",
    heat: [
      { t: "Decide by trigger, not by feel.", d: "Leave for a powered place (family on another grid, a hotel, a cooler town) when any of these is true: an excessive-heat warning plus an outage expected past 24 hours; anyone in the house who is an infant, over 65 or chronically ill; or any sign of heat exhaustion. Public cooling centers hold only a small share of the city, so arrange your destination ahead.", s: "cdcoa" },
      { t: "Fans are not protection in serious heat.", d: "CDC: above 90°F indoors, a fan can raise body temperature. A cool shower or bath, or getting to air conditioning, works better. In dry air, wet skin plus moving air helps more than a dry fan.", s: "cdcab" },
      { t: "Don't expect batteries to run AC.", d: "Estimate: a small window unit draws several hundred watts, so a 1 kWh station runs it for only a couple of hours." },
      { t: "Cut heat gain.", d: "Reflective covers on east-, west- and south-facing windows; live in the lowest interior room; no oven and no exertion at midday." },
      { t: "Medical devices first.", d: "If anyone uses a CPAP, oxygen or refrigerated medication, size a dedicated battery for that device and talk to the supplier before summer." }
    ]
  },

  // ---------------- v1.1: comms ----------------
  comms: {
    ladder: [
      { rung: "Primary", t: "Cell texts, not calls", when: "Towers up but jammed", range: "Anywhere with signal", d: "Texts need far less network capacity and can wait in line until it frees up.", s: "fcc" },
      { rung: "Alternate", t: "Messages and Find My via satellite", when: "Towers down, open sky", range: "Outdoors, anywhere", d: "iPhone 14 and newer. Practice the demo before you need it." },
      { rung: "Contingency", t: "Meshtastic family mesh", when: "No towers and no sky view: indoors, at night", range: "About 2–5 km per hop (estimate); less in town, more from height", d: "A radio per person paired to their phone, plus a base node placed high at home." },
      { rung: "Emergency", t: "GMRS radios, then the rally point", when: "Phones dead or lost", range: "About 1–3 km handheld (estimate)", d: "Agreed channel; meet at the rally point at the next check-in time." }
    ],
    rules: [
      { t: "One out-of-area contact", d: "Everyone texts them \"OK + location\". Long-distance calls can connect when calls across town won't." },
      { t: "Check-in windows", d: "Five minutes each, radios off in between to save battery." },
      { t: "Three rally points", d: "Home, a neighborhood spot and an out-of-area address. Keep them in HAVYN, on paper and in every go-bag." },
      { t: "Text 911 if you can't call", d: "Maricopa County has taken texts to 911 since 2018: call if you can, text if you can't. Put your address in the first text; no group texts. A bounce-back message means call instead.", s: "text911" },
      { t: "GMRS license", d: "$35 for 10 years, no exam. The holder must be 18 or older; it covers immediate family of any age. FRS radios need no license but have lower power.", s: "gmrs" },
      { t: "News in", d: "A hand-crank or battery AM/FM radio with NOAA Weather Radio gets emergency broadcasts with no network at all." },
      { t: "Bitchat", d: "Free. Install it, but count on it only if neighbors run it too." }
    ]
  },

  // ---------------- v1.2: numbers (checked 2026-11-14 on each provider's own page) ----------------
  numbers: [
    { n: "Emergency", num: "911", d: "Police, fire, medical. Text 911 if you can't talk." },
    { n: "Poison Control", num: "1-800-222-1222", d: "Poisoning, medicine mistakes, carbon monoxide, bites and stings. 24/7." },
    { n: "APS power outage", num: "602-371-7171", d: "If APS is your electric company.", s: "phxcontacts" },
    { n: "SRP power outage", num: "602-236-8888", d: "If SRP is your electric company. 24/7.", s: "srp" },
    { n: "SRP power emergency", num: "602-236-8811", d: "Fallen lines, arcing, electric shock. For an injury, call 911 first.", s: "srpc" },
    { n: "Southwest Gas emergency", num: "877-860-6020", d: "Smell gas? Get everyone out first, then call 911 and Southwest Gas from a safe place.", s: "swgas" },
    { n: "Phoenix water emergency", num: "602-261-8000", d: "Main breaks and sewer overflows. 24/7.", s: "phxwater" },
    { n: "Phoenix police non-emergency", num: "602-262-6151", d: "Crime Stop: police help that isn't a 911 emergency.", s: "phxpd" }
  ],

  // ---------------- v1.1: library ----------------
  library: {
    note: "PDFs stay on this phone and are not part of Memory Cards. AirDrop the files to each phone and import them there.",
    suggest: [
      { t: "The HAVYN plan PDF", d: "The Offline Survival Plan you were sent." },
      { t: "Manuals for your power station, radios and filter", d: "Download them from each maker's site while you have internet." },
      { t: "Where There Is No Doctor (Hesperian)", d: "A free download from hesperian.org.", u: "https://hesperian.org/" },
      { t: "Your own papers", d: "Insurance, prescriptions, copies of IDs. They never leave this phone." }
    ]
  },

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
    cdcillness: { n: "CDC: heat-related illness", u: "https://www.cdc.gov/disasters/extremeheat/pdf/Heat_Related_Illness.pdf" },
    text911: { n: "KTAR: text 911 anywhere in Maricopa County", u: "https://ktar.com/arizona-news/people-in-maricopa-county-can-now-text-911-in-case-of-an-emergency" },
    gmrs: { n: "Midland: GMRS licensing", u: "https://midlandusa.com/pages/licensing" },
    phxcontacts: { n: "City of Phoenix: emergency contacts", u: "https://phoenix.gov/emergency/emergency-contacts" },
    srp: { n: "SRP: power outages and storm safety", u: "https://www.srpnet.com/safety/outage/default.aspx" },
    srpc: { n: "SRP: contact us", u: "https://srpnet.com/contactus" },
    swgas: { n: "Southwest Gas: general safety (2026)", u: "https://www.swgas.com/1409225179571/General-Safety-2026.pdf" },
    phxwater: { n: "Phoenix Water Services: contact", u: "https://www.phoenix.gov/administration/departments/waterservices/contact-us.html" },
    phxpd: { n: "Phoenix Police: contact", u: "https://www.phoenix.gov/administration/departments/police/contact-us.html" },
    applemaps: { n: "Apple: download maps to use offline", u: "https://support.apple.com/en-us/105084" },
    adot: { n: "ADOT: Pull Aside, Stay Alive (dust storms)", u: "https://www.azdot.gov/about/transportation-safety/severe-weather/dust-storms" },
    nwsflood: { n: "NWS: Turn Around Don't Drown", u: "https://www.weather.gov/safety/flood-turn-around-dont-drown" },
    nwslightning: { n: "NWS: lightning safety", u: "https://www.weather.gov/safety/lightning-safety-overview" },
    maricopa: { n: "Maricopa County: Ready, Set, Go", u: "https://www.maricopa.gov/5143/Most-Common-Natural-Hazards" },
    azein: { n: "Arizona (AZEIN): Ready, Set, Go!", u: "https://azein.gov/ready-set-go" },
    epasmoke: { n: "EPA: reduce your smoke exposure (EPA-452/F-18-003)", u: "https://www.neha.org/Images/resources/Reduce%20Wildfire%20Smoke%20Exposure.pdf" },
    epasmoke2: { n: "EPA: reduce health risks from wildfire smoke", u: "https://www.epa.gov/sites/default/files/2018-11/documents/reduce-health-risks-with-wildfire-smoke-1.pdf" },
    airnowresp: { n: "AirNow: protect your lungs from wildfire smoke or ash", u: "https://www.airnow.gov/sites/default/files/2021-07/respiratory-protection-factsheet-072021.pdf" },
    cdcboil: { n: "CDC: drinking water advisories", u: "https://cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html" },
    cdcwater: { n: "CDC: making water safe in an emergency", u: "https://www.cdc.gov/water-emergency/about/index.html" },
    cdcstore: { n: "CDC: create and store an emergency water supply", u: "https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html" },
    ctflush: { n: "Connecticut DPH: after a boil-water notice ends (template)", u: "https://portal.ct.gov/-/media/Departments-and-Agencies/DPH/dph/drinking_water/pdf/Boil-Water-Notice-Concluded_residential.pdf" },
    readyfloods: { n: "Ready.gov: floods", u: "https://www.ready.gov/floods" },
    nwsflooddur: { n: "NWS: during a flood", u: "https://www.weather.gov/safety/flood-during" },
    tep: { n: "TEP: vehicle safety around downed power lines", u: "https://www.tep.com/news/vehicle-safety-around-downed-power-lines/" },
    mcnotify: { n: "Maricopa County: emergency notifications", u: "https://www.maricopa.gov/1755/Emergency-Notifications" },
    epaheatsmoke: { n: "EPA: heat and smoke (2026)", u: "https://www.epa.gov/system/files/documents/2026-06/heat-and-smoke-factsheet_1.pdf" },
    epacleanroom: { n: "EPA: create a clean room", u: "https://www.epa.gov/indoor-air-quality-iaq/create-clean-room-protect-indoor-air-quality-during-wildfire" },
    epadiy: { n: "EPA: DIY air cleaners for wildfire smoke", u: "https://www.epa.gov/air-research/research-diy-air-cleaners-reduce-wildfire-smoke-indoors" },
    epalungs: { n: "EPA: protect your lungs from wildfire smoke (2026)", u: "https://www.epa.gov/system/files/documents/2026-06/protect-your-lungs-factsheet.pdf" },
    cdcsmokeheart: { n: "CDC: wildfire smoke and heart disease", u: "https://www.cdc.gov/air/wildfire-smoke/heart-disease.htm" }
  }
};
if (typeof module !== "undefined") module.exports = HAVYN_CONTENT;
