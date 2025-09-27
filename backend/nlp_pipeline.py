
import re
from transformers import pipeline
import torch
import spacy

def load_nlp_models():
    models = {}
    try:
        models["scispacy"] = spacy.load("en_ner_bc5cdr_md")
    except Exception as e:
        print(f"Error loading scispaCy model: {e}")
        models["scispacy"] = None
    return models

def extract_medical_entities(text, models):
    scispacy = models.get("scispacy")
    medications = set()
    symptoms = set()
    diseases = set()
    tests = set()
    if scispacy:
        doc = scispacy(text)
        for ent in doc.ents:
            # CHEMICAL for medications, DISEASE for diseases, SYMPTOM for symptoms (if available)
            if ent.label_ == "CHEMICAL":
                medications.add(ent.text.lower())
            elif ent.label_ == "DISEASE":
                diseases.add(ent.text.lower())
            elif ent.label_ == "SYMPTOM":
                symptoms.add(ent.text.lower())

    # Patch: If a disease matches a known symptom, add it to symptoms as well
    # Import symptom_to_diagnosis mapping from suggester
    try:
        from suggester import symptom_to_diagnosis
        for d in list(diseases):
            if d in symptom_to_diagnosis:
                symptoms.add(d)
    except Exception as e:
        print(f"[extract_medical_entities] Could not patch symptoms from diseases: {e}")
    # Simple keyword-based test detection
    test_keywords = ["x-ray", "cbc", "mri", "ct", "ultrasound", "blood test", "scan"]
    for kw in test_keywords:
        if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE):
            tests.add(kw)
    return {
        "symptoms": sorted(symptoms),
        "diseases": sorted(diseases),
        "medications": sorted(medications),
        "tests": sorted(tests)
    }
