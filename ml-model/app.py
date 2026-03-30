"""
Flask ML Inference Server
Plant Disease Identifier — FYP Project

Endpoints:
  POST /predict      → accepts multipart image, returns disease prediction
  GET  /health       → health check
  GET  /classes      → list all supported disease classes
"""

import os
import io
import json
import logging
import numpy as np
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from dotenv import load_dotenv

# ── Load environment ──────────────────────────────────────────────────────────
load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["http://localhost:5000", "http://localhost:5173", "http://localhost:3000"])

# ── Constants ─────────────────────────────────────────────────────────────────
MODEL_DIR  = Path(__file__).parent / "model"
MODEL_PATH = MODEL_DIR / "plant_disease_model.h5"
LABELS_PATH = MODEL_DIR / "class_labels.json"
IMG_SIZE   = (224, 224)          # resize target (matches training)
TOP_K      = 3                   # return top-3 predictions

# ── Translations for UI (Urdu / Punjabi / Sindhi stubs) ──────────────────────
TRANSLATIONS: dict[str, dict] = {
    "Tomato___Early_blight": {
        "en": "Remove infected lower leaves and apply copper-based fungicide weekly.",
        "ur": "متاثرہ نچلے پتوں کو ہٹا دیں اور ہفتہ وار تانبے پر مبنی فنگسائڈ لگائیں۔",
        "pa": "ਪ੍ਰਭਾਵਿਤ ਹੇਠਲੇ ਪੱਤੇ ਹਟਾਓ ਅਤੇ ਹਰ ਹਫ਼ਤੇ ਤਾਂਬੇ ਦਾ ਉੱਲੀਨਾਸ਼ਕ ਲਗਾਓ।",
        "sd": "متاثر ٿيل هيٺين پنن کي هٽايو ۽ هفتيوار تانبي وارو فنگسائڊ لڳايو۔",
    },
    "Tomato___Late_blight": {
        "en": "Destroy infected plants immediately. Apply mancozeb or chlorothalonil fungicide.",
        "ur": "متاثرہ پودوں کو فوری طور پر تباہ کریں۔ مانکوزیب یا کلوروتھالونل فنگسائڈ لگائیں۔",
        "pa": "ਪ੍ਰਭਾਵਿਤ ਪੌਦੇ ਤੁਰੰਤ ਨਸ਼ਟ ਕਰੋ। ਮੈਨਕੋਜ਼ੇਬ ਜਾਂ ਕਲੋਰੋਥਾਲੋਨਿਲ ਉੱਲੀਨਾਸ਼ਕ ਲਗਾਓ।",
        "sd": "متاثر ٿيل پودن کي فوري طور تي ختم ڪريو۔ مانڪوزيب يا ڪلوروٿالونيل فنگسائڊ لڳايو۔",
    },
    "Potato___Early_blight": {
        "en": "Apply azoxystrobin or chlorothalonil. Remove and destroy infected leaves.",
        "ur": "ایزوکسیسٹروبن یا کلوروتھالونل استعمال کریں۔ متاثرہ پتیوں کو ہٹا کر تباہ کریں۔",
        "pa": "ਅਜ਼ੋਕਸੀਸਟ੍ਰੋਬਿਨ ਜਾਂ ਕਲੋਰੋਥਾਲੋਨਿਲ ਲਗਾਓ। ਪ੍ਰਭਾਵਿਤ ਪੱਤੇ ਹਟਾ ਕੇ ਨਸ਼ਟ ਕਰੋ।",
        "sd": "ايزوڪسيسٽروبن يا ڪلوروٿالونل لڳايو۔ متاثر ٿيل پنن کي هٽائي ختم ڪريو۔",
    },
    "Potato___Late_blight": {
        "en": "Apply preventive fungicide. Ensure good drainage and avoid overhead watering.",
        "ur": "احتیاطی فنگسائڈ لگائیں۔ اچھی نکاسی کو یقینی بنائیں اور اوپر سے پانی دینے سے گریز کریں۔",
        "pa": "ਰੋਕਥਾਮ ਵਾਲਾ ਉੱਲੀਨਾਸ਼ਕ ਲਗਾਓ। ਚੰਗੀ ਡਰੇਨੇਜ ਯਕੀਨੀ ਬਣਾਓ।",
        "sd": "احتياطي فنگسائڊ لڳايو۔ سٺي نيڪاسي کي يقيني بڻايو۔",
    },
    "Corn_(maize)___Common_rust_": {
        "en": "Apply triazole or strobilurin fungicide. Plant rust-resistant varieties.",
        "ur": "ٹرائیازول یا اسٹروبیلورن فنگسائڈ لگائیں۔ زنگ مزاحم اقسام لگائیں۔",
        "pa": "ਟ੍ਰਾਈਆਜੋਲ ਉੱਲੀਨਾਸ਼ਕ ਲਗਾਓ। ਜੰਗ-ਰੋਧਕ ਕਿਸਮਾਂ ਲਗਾਓ।",
        "sd": "ٽرائيازول فنگسائڊ لڳايو۔ زنگ مزاحم قسم پوکيو۔",
    },
}

# ── Default treatment for unlisted classes ────────────────────────────────────
DEFAULT_TREATMENT = {
    "en": "Consult a local agricultural extension officer for specific treatment advice.",
    "ur": "مخصوص علاج کے مشورے کے لیے مقامی زرعی توسیعی افسر سے رابطہ کریں۔",
    "pa": "ਖਾਸ ਇਲਾਜ ਦੀ ਸਲਾਹ ਲਈ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਅਫਸਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
    "sd": "مخصوص علاج جي صلاح لاءِ مقامي زرعي آفيسر سان رابطو ڪريو۔",
}

# ── Load model & labels at startup ────────────────────────────────────────────
model = None
class_labels: dict = {}


def load_resources():
    """Load TF model and class labels. Called once at startup."""
    global model, class_labels

    # Load class labels
    if not LABELS_PATH.exists():
        logger.error(f"class_labels.json not found at {LABELS_PATH}")
        raise FileNotFoundError(f"Missing {LABELS_PATH}")

    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        class_labels = json.load(f)
    logger.info(f"Loaded {len(class_labels)} class labels.")

    # Load Keras model (optional if .h5 not yet present — runs in demo mode)
    if MODEL_PATH.exists():
        import tensorflow as tf
        model = tf.keras.models.load_model(str(MODEL_PATH))
        logger.info(f"Model loaded from {MODEL_PATH}")
    else:
        logger.warning(
            f"Model file not found at {MODEL_PATH}. "
            "Running in DEMO mode — predictions will be random stubs."
        )


# ── Image pre-processing ──────────────────────────────────────────────────────

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes → normalised numpy array (1, H, W, 3)."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0   # normalise to [0, 1]
    return np.expand_dims(arr, axis=0)               # add batch dim


# ── Prediction helper ─────────────────────────────────────────────────────────

def predict_disease(image_bytes: bytes) -> dict:
    """Run inference and return structured prediction result."""
    tensor = preprocess_image(image_bytes)

    if model is not None:
        # Real inference
        preds = model.predict(tensor, verbose=0)[0]  # shape: (num_classes,)
    else:
        # Demo mode — generate plausible random scores
        np.random.seed(int.from_bytes(image_bytes[:4], "big") % (2**31))
        preds = np.random.dirichlet(np.ones(len(class_labels)))

    # Top-K results
    top_indices = np.argsort(preds)[::-1][:TOP_K]
    top_results = []
    for idx in top_indices:
        label = class_labels.get(str(idx), "Unknown")
        confidence = float(preds[idx])
        top_results.append({"label": label, "confidence": round(confidence, 4)})

    # Primary prediction
    primary = top_results[0]
    label   = primary["label"]

    # Parse plant and disease from label (e.g. "Tomato___Early_blight")
    if "___" in label:
        plant, disease = label.split("___", 1)
        disease_display = disease.replace("_", " ")
        plant_display   = plant.replace("_", " ")
    else:
        plant_display   = "Unknown"
        disease_display = label

    is_healthy = "healthy" in label.lower()

    return {
        "disease":     disease_display,
        "plant":       plant_display,
        "label":       label,
        "confidence":  primary["confidence"],
        "is_healthy":  is_healthy,
        "top_results": top_results,
        "solutions":   TRANSLATIONS.get(label, DEFAULT_TREATMENT),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":     "OK",
        "model_loaded": model is not None,
        "classes":    len(class_labels),
        "demo_mode":  model is None,
    })


@app.route("/classes", methods=["GET"])
def classes():
    """Return all supported disease class labels."""
    return jsonify({"classes": list(class_labels.values()), "total": len(class_labels)})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accept a plant image and return disease prediction.

    Request  : multipart/form-data  field name = 'image'
    Response : JSON prediction result
    """
    if "image" not in request.files:
        return jsonify({"error": "No image field in request"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # Validate MIME
    allowed_mimes = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
    if file.content_type not in allowed_mimes:
        return jsonify({"error": f"Unsupported image type: {file.content_type}"}), 415

    try:
        image_bytes = file.read()
        if len(image_bytes) == 0:
            return jsonify({"error": "Empty image file"}), 400

        result = predict_disease(image_bytes)
        logger.info(f"Prediction: {result['label']} ({result['confidence']:.2%})")
        return jsonify(result)

    except Exception as exc:
        logger.exception("Prediction error")
        return jsonify({"error": str(exc)}), 500


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    load_resources()
    port  = int(os.getenv("ML_PORT", 8000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    logger.info(f"Starting Flask ML server on port {port}  debug={debug}")
    app.run(host="0.0.0.0", port=port, debug=debug)
