from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import requests
import os
# uvicorn diagnosis_api:app --host 0.0.0.0 --port 8000 --reload
# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Constants
MODEL_PATH = r"C:\Users\moham\Desktop\Projects\Project School\2-1\Plant Disease Detection\AI-Driven-Plant-Disease-Detection\leaf_classifaction_model\leaf_classifier_model.keras"
API_URL = "https://api-inference.huggingface.co/models/ozair23/mobilenet_v2_1.0_224-finetuned-plantdisease"
HEADERS = {"Authorization": "Bearer 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"}

# Initialize FastAPI
app = FastAPI()

# Load the TensorFlow model once at startup
try:
    print("Loading TensorFlow model...")
    model = load_model(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading TensorFlow model: {e}")
    model = None

# Function to call Hugging Face API
def query_huggingface(file_path: str):
    try:
        with open(file_path, "rb") as f:
            data = f.read()
        response = requests.post(API_URL, headers=HEADERS, data=data)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Hugging Face API error: {e}")
        return [{"label": "Unknown", "score": 0}]

# Function to classify an image
def classify_image(file_path: str):
    try:
        img_height, img_width = 224, 224
        img = image.load_img(file_path, target_size=(img_height, img_width))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
      
        # Predict using the TensorFlow model
        prediction = model.predict(img_array, verbose=0)
        if prediction[0] <= 0.5:  # Assume "leaf" is represented by values <= 0.5
            huggingface_result = query_huggingface(file_path)
            if(len(huggingface_result)<=4):
                huggingface_result = query_huggingface(file_path)
            if(len(huggingface_result)<=4):
                huggingface_result = query_huggingface(file_path)

            return "Leaf", huggingface_result
        else:
            return "Not a leaf", []
    except Exception as e:
        print(f"Error during image classification: {e}")
        raise HTTPException(status_code=500, detail="Error during image classification")

# API route to classify images
@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded")

    try:
        # Save the uploaded file locally
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Classify the image
        result, huggingface_result = classify_image(file_path)
        # Remove the temporary file
        os.remove(file_path)
        print("huggingface_result:",huggingface_result)
        if result == "Not a leaf":
            return JSONResponse(content={"output": "Not a leaf"})
        else:
            first_prediction = huggingface_result[0]
            label = first_prediction.get("label", "Unknown")
            score = first_prediction.get("score", 0)
            return JSONResponse(
                content={
                    "disease_name": label,
                    "confidence_score": round(score, 4),
                    "output": f"Plant Disease: {label}, Confidence Score: {score:.4f}",
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
