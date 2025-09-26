

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
    # Simple mappings for demo purposes
    disease_to_tests = {
        "fever": ["CBC", "Blood culture"],
        "diabetes": ["Fasting blood sugar", "HbA1c"],
        "asthma": ["Spirometry", "Peak flow measurement"],
        "cancer": ["Biopsy", "CT scan"],
    }
    disease_to_meds = {
        "fever": ["paracetamol"],
        "diabetes": ["metformin", "insulin"],
        "asthma": ["albuterol", "inhaled corticosteroids"],
        "cancer": ["chemotherapy", "immunotherapy"],
    }
    if len(audio_bytes) == 0:
        print("No audio data received, skipping transcription.")
        response = {"transcript": "No audio data received. Please try again.", "entities": {"diseases": [], "drugs": [], "symptoms": []}, "suggestions": {"tests": [], "medicines": []}}
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
        diseases = [ent.text.lower() for ent in doc.ents if ent.label_ == "DISEASE"]
        drugs = [ent.text for ent in doc.ents if ent.label_ == "CHEMICAL"]
        symptoms = []
        # Suggest tests and medicines for detected diseases
        suggested_tests = []
        suggested_meds = []
        for disease in diseases:
            suggested_tests.extend(disease_to_tests.get(disease, []))
            suggested_meds.extend(disease_to_meds.get(disease, []))
        response = {
            "transcript": text,
            "entities": {
                "diseases": diseases,
                "drugs": drugs,
                "symptoms": symptoms
            },
            "suggestions": {
                "tests": list(set(suggested_tests)),
                "medicines": list(set(suggested_meds))
            }
        }
    except Exception as e:
        response = {"transcript": f"Transcription or NLP error: {e}", "entities": {"diseases": [], "drugs": [], "symptoms": []}, "suggestions": {"tests": [], "medicines": []}}
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
