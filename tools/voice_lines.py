"""Every line HAVYN speaks, as the voice should say it.

welcome/tour lines: src/voice/lines.json ([{id, text}]), spoken as written.
emergency cards: generated from src/content.js, one line per step ("c-<card>-<step>"): the card's title before the
first step, then the step's title and detail, rewritten for the ear (911 as "nine one one", mg as milligrams, the
Poison Control number digit by digit, inches, minutes, degrees Fahrenheit). Used by tools/voice_render.py (to record)
and tools/build.py (to ship only recordings whose words still match the card)."""
import json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

RULES = [
    (r"\s*\(\d+(?:\.\d+)? cm\)", ""),                       # "2 in (5 cm)": the ear needs one unit
    (r"1-800-222-1222", "one eight hundred, two two two, one two two two"),
    (r"\b911\b", "nine one one"), (r"\b(\d+) ft\b", r"\1 feet"),
    (r"\b24/7\b", "twenty-four seven"),
    (r"(\d+)\s?°F\b", r"\1 degrees Fahrenheit"),
    (r"\b1/2 cup\b", "half a cup"),
    (r"\b(\d+(?:\.\d+)?) mg (?=tablet|low-dose|dose)", r"\1 milligram "),   # "a 325 milligram tablet"
    (r"\b(\d+(?:\.\d+)?) mg\b", r"\1 milligrams"),
    (r"\b1 g\b", "1 gram"), (r"\b(\d+) g\b", r"\1 grams"),
    (r"\b1 in\b", "1 inch"), (r"\b(\d+(?:\.\d+)?) in\b", r"\1 inches"),
    (r"\b1 min\b", "1 minute"), (r"\b(\d+) min\b", r"\1 minutes"),
    (r"\s*/\s*min\b", " a minute"),
    (r"\bCPR\b", "C P R"), (r"\bAED\b", "A E D"), (r"\bCDC\b", "C D C"), (r"\bER\b", "E R"), (r"\bCO\b", "carbon monoxide"),
    (r"\bHAVYN\b", "Haven"),
    (r"\s*›\s*", ", "),
    (r"(\d):(?=\s)", r"\1,"),                                  # "under 70: another" -> a pause, not a ratio
    (r"\s{2,}", " "),
]


def speak(text):
    t = text
    for a, b in RULES: t = re.sub(a, b, t)
    t = t.strip()
    return t[:1].upper() + t[1:]


def cards():
    js = "const C=require(process.argv[1]); process.stdout.write(JSON.stringify(C.cards.map(c => ({id: c.id, title: c.title, steps: c.steps.map(s => [s.t, s.d])}))))"
    data = json.loads(subprocess.run(["node", "-e", js, str(ROOT / "src" / "content.js")], check=True, capture_output=True, text=True).stdout)
    out = []
    for c in data:
        for i, (t, d) in enumerate(c["steps"]):
            t = (t or "").strip(); t = t if t[-1:] in ".?!" else t.rstrip(":") + "."
            line = ((c["title"] + ". ") if i == 0 else "") + t + ((" " + d) if d else "")
            out.append({"id": "c-%s-%d" % (c["id"], i), "text": speak(line), "kind": "card"})
    return out


def sims():
    """Sim Lab narration: each sim's intro (s-<sim>), each question or scan (s-<sim>-<frame>; not the sound questions,
    where the alarm itself plays) and each explanation (s-<sim>-<frame>-ok)."""
    js = "process.stdout.write(JSON.stringify(require(process.argv[1]).list))"
    data = json.loads(subprocess.run(["node", "-e", js, str(ROOT / "src" / "sims.js")], check=True, capture_output=True, text=True).stdout)
    out = []
    for s in data:
        if s.get("say"): out.append({"id": "s-%s" % s["id"], "text": speak(s["say"]), "kind": "sim"})
        for i, f in enumerate(s.get("frames", [])):
            q = f.get("say") or (None if f.get("sound") else f.get("q"))
            if q: out.append({"id": "s-%s-%d" % (s["id"], i), "text": speak(q), "kind": "sim"})
            if f.get("ok"): out.append({"id": "s-%s-%d-ok" % (s["id"], i), "text": speak(f["ok"]), "kind": "sim"})
    return out


def all_lines():
    base = json.loads((ROOT / "src" / "voice" / "lines.json").read_text(encoding="utf-8"))
    return [dict(l, kind="ui") for l in base] + cards() + sims()


if __name__ == "__main__":
    for l in all_lines()[:3] + cards()[:8]: print(l["id"], "|", l["text"])
