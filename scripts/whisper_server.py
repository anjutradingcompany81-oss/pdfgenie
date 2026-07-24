#!/usr/bin/env python3
"""
Minimal local speech-to-text service backing the Audio to Text / Video to
Text tools. Loads the faster-whisper model ONCE at startup (reloading it
per-request costs several seconds) and exposes it over HTTP on localhost
only — this is an internal service, never exposed to the public internet.
Run under the dedicated venv at /opt/pdfgenie-ml/venv (not the app's own
node_modules — this is Python, kept entirely separate from the Next.js app).
"""
import os
import tempfile

from faster_whisper import WhisperModel
from flask import Flask, jsonify, request

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
PORT = int(os.environ.get("WHISPER_PORT", "5006"))

app = Flask(__name__)
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_SIZE})


@app.post("/transcribe")
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided."}), 400

    audio = request.files["audio"]
    suffix = os.path.splitext(audio.filename or "")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        audio.save(tmp.name)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(tmp_path)
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return jsonify({"text": text, "language": info.language})
    except Exception as exc:  # noqa: BLE001 — surfaced to the caller, not swallowed
        return jsonify({"error": str(exc)}), 500
    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT)
