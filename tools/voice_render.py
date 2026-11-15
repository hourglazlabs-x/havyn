"""Render HAVYN's spoken lines in an elegant British woman's voice with Kokoro-82M (hexgrad, Apache-2.0).

Runs in GitHub Actions (.github/workflows/voice.yml), which commits the results. Reads src/voice/lines.json
([{id, text}]); writes src/voice/<id>.mp3 and src/voice/manifest.json ({voice, speed, model, lines: {id: {text, file,
bytes, sha256, ms}}}); with --samples, also src/voice/samples/<voice>.mp3, one line in each British woman's voice
so a person can choose. Every phone then plays the same voice, offline, whatever voices it has installed.

Each line: Kokoro at 24 kHz, then a gentle broadcast chain (rumble cut, de-essing, light compression, loudness to
-17 LUFS, trimmed silence, short fades), MP3 96 kbit/s mono. Usage: voice_render.py [--voice bf_emma] [--speed 0.95] [--samples]
"""
import argparse, hashlib, json, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro import KPipeline

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


def encode(audio, tmp, mp3):
    sf.write(tmp, audio, 24000)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-af", CHAIN, "-ac", "1", "-ar", "24000",
                    "-c:a", "libmp3lame", "-b:a", "96k", str(mp3)], check=True)
    ms = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
                              check=True, capture_output=True, text=True).stdout.strip() or 0) * 1000
    return int(ms)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="bf_emma")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--samples", action="store_true")
    a = ap.parse_args()
    lines = json.loads((VDIR / "lines.json").read_text(encoding="utf-8"))
    pipe = KPipeline(lang_code="b")   # British English
    tmp = Path("/tmp/havyn-voice"); tmp.mkdir(exist_ok=True)
    for old in VDIR.glob("*.mp3"): old.unlink()
    out = {"voice": a.voice, "speed": a.speed, "model": "hexgrad/Kokoro-82M (Apache-2.0)", "lines": {}}
    for ln in lines:
        mp3 = VDIR / (ln["id"] + ".mp3")
        ms = encode(render(pipe, a.voice, a.speed, ln["text"]), tmp / (ln["id"] + ".wav"), mp3)
        b = mp3.read_bytes()
        if len(b) < 2000 or ms < 400: raise SystemExit("%s came out empty (%d bytes, %d ms)" % (ln["id"], len(b), ms))
        out["lines"][ln["id"]] = {"text": ln["text"], "file": mp3.name, "bytes": len(b), "sha256": hashlib.sha256(b).hexdigest(), "ms": ms}
        print("%-9s %5d ms %6d bytes  %s" % (ln["id"], ms, len(b), ln["text"]))
    (VDIR / "manifest.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    if a.samples:
        sd = VDIR / "samples"; sd.mkdir(exist_ok=True)
        for v in ("bf_emma", "bf_isabella", "bf_alice", "bf_lily"):
            ms = encode(render(pipe, v, a.speed, SAMPLE), tmp / (v + ".wav"), sd / (v + ".mp3"))
            print("sample %-12s %5d ms" % (v, ms))


if __name__ == "__main__":
    main()
