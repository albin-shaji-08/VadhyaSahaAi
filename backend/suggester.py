# backend/suggester.py

default_kb = {
    "pneumonia": {
        "tests": ["Chest X-ray", "CBC"],
        "meds": ["Amoxicillin", "Azithromycin"]
    },
    "diabetes": {
        "tests": ["HbA1c", "FBS"],
        "meds": ["Metformin", "Insulin"]
    }
}

# Simple symptom-to-diagnosis mapping
symptom_to_diagnosis = {
    "cough": "pneumonia",
    "fever": "pneumonia",
    "high blood sugar": "diabetes",
    "polyuria": "diabetes",
    "polydipsia": "diabetes"
}

def suggest(entities, kb=default_kb):
    symptoms = set(entities.get("symptoms", []))
    diagnoses = set()
    recommended_tests = set()
    possible_meds = set()
    # Map symptoms to diagnoses
    for symptom in symptoms:
        diagnosis = symptom_to_diagnosis.get(symptom.lower())
        if diagnosis:
            diagnoses.add(diagnosis)
    # For each diagnosis, add tests and meds
    for diag in diagnoses:
        info = kb.get(diag, {})
        for t in info.get("tests", []):
            recommended_tests.add(t)
        for m in info.get("meds", []):
            possible_meds.add(m)
    return {
        "possible_diagnoses": sorted(diagnoses),
        "recommended_tests": sorted(recommended_tests),
        "possible_medications": sorted(possible_meds)
    }
