"""Render HAVYN's spoken lines in an elegant British woman's voice with Kokoro-82M (hexgrad, Apache-2.0).

Runs in GitHub Actions (.github/workflows/voice.yml), which commits the results. The lines come from
tools/voice_lines.py: the welcome and tour (src/voice/lines.json) and every emergency-card step (from src/content.js,
rewritten for the ear). Writes src/voice/<id>.mp3 (welcome and tour) and src/voice/c/<id>.mp3 (cards), and
src/voice/manifest.json ({voice, speed, model, lines: {id: {text, file, bytes, sha256, ms}}}). A line whose words,
voice and speed haven't changed is kept as it is. With --samples, also src/voice/samples/<voice>.mp3, one line in each
British woman's voice so a person can choose. Every phone then plays the same voice, offline.

Each line: Kokoro at 24 kHz, then a gentle broadcast chain (rumble cut, de-essing, light compression, loudness to
-17 LUFS, trimmed silence, short fades), MP3 96 kbit/s mono. Usage: voice_render.py [--voice bf_emma] [--speed 0.95] [--samples]
"""
import argparse, hashlib, json, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro import KPipeline
import voice_lines

ROOT = Path(__file__).resolve().parent.parent
VDIR = ROOT / "src" / "voice"
CHAIN = ",".join([
    "highpass=f=60",
    "deesser=i=0.35",
    "acompressor=threshold=-21dB:ratio=2.2:attack=6:release=140:makeup=1.5",
    "silenceremove=start_periods=1:start_threshold=-48dB", "areverse",
    "silenceremove=start_periods=1:start_threshold=-48dB", "areverse",
    "loudnorm=I=-17:TP=-1.5:LRA=7",
    "afade=t=in:st=0:d=0.015", "apad=pad_dur=0.12",
])
SAMPLE = "Welcome to Haven. Let me show you around. In an emergency, tap the red button."


def render(pipe, voice, speed, text):
    parts = []
    for _, _, audio in pipe(text, voice=voice, speed=speed):
        parts.append(audio.detach().cpu().numpy() if hasattr(audio, "detach") else np.asarray(audio))
    return np.concatenate(parts)


def encode(audio, tmp, mp3, kbps=96):
    sf.write(tmp, audio, 24000)
    mp3.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-af", CHAIN, "-ac", "1", "-ar", "24000",
                    "-c:a", "libmp3lame", "-b:a", "%dk" % kbps, str(mp3)], check=True)
    ms = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
                              check=True, capture_output=True, text=True).stdout.strip() or 0) * 1000
    return int(ms)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="bf_emma")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--samples", action="store_true")
    a = ap.parse_args()
    lines = voice_lines.all_lines()
    pipe = KPipeline(lang_code="b")   # British English
    tmp = Path("/tmp/havyn-voice"); tmp.mkdir(exist_ok=True)
    old = {}
    if (VDIR / "manifest.json").exists():
        m = json.loads((VDIR / "manifest.json").read_text(encoding="utf-8"))
        if m.get("voice") == a.voice and float(m.get("speed", 0)) == a.speed: old = m.get("lines", {})
    out = {"voice": a.voice, "speed": a.speed, "model": "hexgrad/Kokoro-82M (Apache-2.0)", "lines": {}}
    made = kept = 0
    for ln in lines:
        rel = ("c/" if ln["kind"] == "card" else "") + ln["id"] + ".mp3"; mp3 = VDIR / rel
        o = old.get(ln["id"])
        if o and o.get("text") == ln["text"] and o.get("file") == rel and mp3.exists() and hashlib.sha256(mp3.read_bytes()).hexdigest() == o.get("sha256"):
            out["lines"][ln["id"]] = o; kept += 1; continue
        ms = encode(render(pipe, a.voice, a.speed, ln["text"]), tmp / (ln["id"] + ".wav"), mp3, 64 if ln["kind"] == "card" else 96)
        b = mp3.read_bytes()
        if len(b) < 2000 or ms < 400: raise SystemExit("%s came out empty (%d bytes, %d ms)" % (ln["id"], len(b), ms))
        out["lines"][ln["id"]] = {"text": ln["text"], "file": rel, "bytes": len(b), "sha256": hashlib.sha256(b).hexdigest(), "ms": ms}
        made += 1
        print("%-18s %6d ms %7d bytes  %s" % (ln["id"], ms, len(b), ln["text"][:80]))
    keep = {v["file"] for v in out["lines"].values()}
    for f in list(VDIR.glob("*.mp3")) + list((VDIR / "c").glob("*.mp3")):
        if str(f.relative_to(VDIR)) not in keep: f.unlink()
    print("made %d, kept %d, total %.1f MB" % (made, kept, sum(v["bytes"] for v in out["lines"].values()) / 1e6))
    (VDIR / "manifest.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    if a.samples:
        sd = VDIR / "samples"; sd.mkdir(exist_ok=True)
        for v in ("bf_emma", "bf_isabella", "bf_alice", "bf_lily"):
            ms = encode(render(pipe, v, a.speed, SAMPLE), tmp / (v + ".wav"), sd / (v + ".mp3"))
            print("sample %-12s %5d ms" % (v, ms))


if __name__ == "__main__":
    main()
