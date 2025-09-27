import language_tool_python

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from nlp_pipeline import load_nlp_models, extract_medical_entities
from suggester import suggest
import threading
import subprocess
import os
from fastapi.staticfiles import StaticFiles

app = FastAPI()
# Serve static files (Recorder.js, test_live.html, etc.)
static_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'static')
app.mount('/static', StaticFiles(directory=static_dir), name='static')

# Load NLP models once at startup
nlp_models = None
_nlp_lock = threading.Lock()
def get_nlp_models():
    global nlp_models
    with _nlp_lock:
        if nlp_models is None:
            nlp_models = load_nlp_models()
    return nlp_models

# Pydantic model for request
class AnalyzeTextRequest(BaseModel):
    transcript: str

# POST /analyze_text endpoint
@app.post("/analyze_text")
async def analyze_text(request: AnalyzeTextRequest):
    models = get_nlp_models()
    entities = extract_medical_entities(request.transcript, models)
    suggestions = suggest(entities)
    return {
        "transcript": request.transcript,
        "entities": entities,
        "suggestions": suggestions
    }

import tempfile
import os

import tempfile
import os


import whisper
import json
from pydub import AudioSegment
import noisereduce as nr
import numpy as np

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("medium")

def save_audio_to_tempfile(audio_bytes):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
        f.write(audio_bytes)
        return f.name

# Convert webm to wav for Whisper compatibility
def convert_webm_to_wav(webm_path):
    wav_path = webm_path.replace('.webm', '.wav')
    command = [
        'ffmpeg', '-y', '-i', webm_path,
        '-ar', '16000', '-ac', '1', '-f', 'wav', wav_path
    ]
    subprocess.run(command, check=True)
    return wav_path

    # (removed duplicate definition)

# State for running transcript
running_transcript = ""

async def transcribe_and_respond(new_audio_bytes, websocket, partial=False):
    global running_transcript
    if len(new_audio_bytes) == 0:
        print("No audio data received, skipping transcription.")
        response = {"transcript": "No audio data received. Please try again.", "entities": {"diseases": [], "medications": [], "symptoms": [], "tests": []}, "suggestions": {"tests": [], "medicines": []}, "partial": partial}
        await websocket.send_json(response)
        return
    temp_audio_path = save_audio_to_tempfile(new_audio_bytes)
    print(f"Saved audio chunk to {temp_audio_path}, size: {len(new_audio_bytes)} bytes")
    wav_path = None
    try:
        # Convert webm to wav for Whisper
        wav_path = convert_webm_to_wav(temp_audio_path)
        # --- Audio Preprocessing: Normalize and Denoise ---
        audio = AudioSegment.from_wav(wav_path)
        audio = audio.set_channels(1).set_frame_rate(16000)
        samples = np.array(audio.get_array_of_samples()).astype(np.float32)
        # Normalize
        samples = samples / (np.max(np.abs(samples)) + 1e-8)
        # Denoise
        reduced_noise = nr.reduce_noise(y=samples, sr=16000)
        # Save back to wav
        denoised_audio = AudioSegment(
            (reduced_noise * 32767).astype(np.int16).tobytes(),
            frame_rate=16000,
            sample_width=2,
            channels=1
        )
        denoised_path = wav_path.replace('.wav', '_denoised.wav')
        denoised_audio.export(denoised_path, format="wav")
        # --- Silence Detection ---
        silence_threshold_dbfs = -40  # dBFS, adjust as needed
        if denoised_audio.dBFS < silence_threshold_dbfs:
            print(f"Chunk is silent (dBFS={denoised_audio.dBFS:.2f}), skipping transcription.")
            response = {"transcript": running_transcript.strip(), "entities": {"diseases": [], "medications": [], "symptoms": [], "tests": []}, "suggestions": {"tests": [], "medicines": []}, "partial": partial, "skipped": True}
            await websocket.send_json(response)
            return
        # --- End Silence Detection ---
        # --- End Preprocessing ---
        result = model.transcribe(denoised_path, language="en")
        text = result.get("text", "")
        print(f"Chunk transcription result: {text}")
        # --- Transcript Post-processing: Grammar and punctuation correction ---
        tool = language_tool_python.LanguageTool('en-US')
        corrected_text = tool.correct(text)
        print(f"Corrected transcript: {corrected_text}")
        if corrected_text.strip():
            running_transcript += (" " + corrected_text)
        # Use unified NLP pipeline for entity extraction
        models = get_nlp_models()
        entities = extract_medical_entities(running_transcript, models)
        suggestions = suggest(entities)
        response = {
            "transcript": running_transcript.strip(),
            "entities": entities,
            "suggestions": suggestions,
            "partial": partial
        }
    except Exception as e:
        response = {"transcript": f"Transcription or NLP error: {e}", "entities": {"diseases": [], "medications": [], "symptoms": [], "tests": []}, "suggestions": {"tests": [], "medicines": []}, "partial": partial}
        print(response["transcript"])
    finally:
        os.remove(temp_audio_path)
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)
        denoised_path = None
        try:
            denoised_path = wav_path.replace('.wav', '_denoised.wav')
        except Exception:
            pass
        if denoised_path and os.path.exists(denoised_path):
            os.remove(denoised_path)
    await websocket.send_json(response)


@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection accepted (WAV chunks expected)")
    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.receive":
                if message.get("bytes"):
                    data = message["bytes"]
                    print(f"Received WAV chunk of {len(data)} bytes")
                    # Save chunk to temp file
                    import tempfile
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
                        f.write(data)
                        temp_wav_path = f.name
                    # Try GPU, fallback to CPU if needed
                    try:
                        result = model.transcribe(temp_wav_path, fp16=True, language="en")
                    except Exception as e:
                        print(f"Whisper GPU error: {e}, falling back to CPU...")
                        result = model.transcribe(temp_wav_path, fp16=False, device="cpu", language="en")
                    text = result.get("text", "")
                    print(f"Chunk transcription result: {text}")
                    # NLP pipeline
                    models = get_nlp_models()
                    entities = extract_medical_entities(text, models)
                    suggestions = suggest(entities)
                    print(f"Entities: {entities}")
                    print(f"Suggestions: {suggestions}")
                    # Ensure all keys are present and not empty
                    response = {
                        "transcript": text.strip(),
                        "entities": entities,
                        "suggestions": suggestions
                    }
                    await websocket.send_json(response)
                    os.remove(temp_wav_path)
                elif message.get("text"):
                    try:
                        msg = json.loads(message["text"])
                        if msg.get("type") == "end":
                            print("Received END message from client")
                            break
                    except Exception:
                        print(f"Received text message: {message['text']}")
            elif message["type"] == "websocket.disconnect":
                print("WebSocket disconnected by client")
                break
            else:
                print(f"Received message of type: {message['type']}")
    except WebSocketDisconnect:
        print("WebSocketDisconnect exception")
