

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import tempfile
import os

import tempfile
import os

import whisper
import json
import spacy

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model = whisper.load_model("base")
nlp = spacy.load("en_ner_bc5cdr_md")

def save_audio_to_tempfile(audio_bytes):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
        f.write(audio_bytes)
        return f.name

async def transcribe_and_respond(audio_bytes, websocket):
    if len(audio_bytes) == 0:
        print("No audio data received, skipping transcription.")
        response = {"transcript": "No audio data received. Please try again.", "entities": {"diseases": [], "drugs": [], "symptoms": []}}
        await websocket.send_json(response)
        return
    temp_audio_path = save_audio_to_tempfile(audio_bytes)
    print(f"Saved audio to {temp_audio_path}, size: {len(audio_bytes)} bytes")
    try:
        result = model.transcribe(temp_audio_path)
        text = result.get("text", "")
        print(f"Transcription result: {text}")
        # NLP entity extraction
        doc = nlp(text)
        diseases = [ent.text for ent in doc.ents if ent.label_ == "DISEASE"]
        drugs = [ent.text for ent in doc.ents if ent.label_ == "CHEMICAL"]
        # scispaCy does not have a dedicated "SYMPTOM" label, so we leave it empty or use custom logic if needed
        symptoms = []
        response = {
            "transcript": text,
            "entities": {
                "diseases": diseases,
                "drugs": drugs,
                "symptoms": symptoms
            }
        }
    except Exception as e:
        response = {"transcript": f"Transcription or NLP error: {e}", "entities": {"diseases": [], "drugs": [], "symptoms": []}}
        print(response["transcript"])
    finally:
        os.remove(temp_audio_path)
    await websocket.send_json(response)

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection accepted")
    audio_bytes = bytearray()
    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.receive":
                if message.get("bytes"):
                    data = message["bytes"]
                    print(f"Received audio chunk of {len(data)} bytes")
                    audio_bytes.extend(data)
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
    await transcribe_and_respond(audio_bytes, websocket)
