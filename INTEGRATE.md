I have a FastAPI app (biometric-service) that performs face recognition using face_recognition and OpenCV.
Currently, it only stores face encodings in memory.

I want you to modify the service so that:

When a user’s face is registered, the encoding and metadata are saved in MongoDB.

When a voter later logs in or registers a vote, the system can verify the live face against the encoding saved in MongoDB.

The in-memory dictionary caching should still exist for speed — but MongoDB must remain the single source of truth.

Use pymongo for database access.

Include Fernet encryption for storing encodings securely (optional but recommended).

Provide simple functions like:

save_face_encoding(user_id, encoding, metrics)

get_face_encoding(user_id)

verify_user_face(user_id, live_image)

Write clean, production-style Python code with error handling and logs.

Integrate this logic with my existing FastAPI endpoints under /api/biometrics/face/register and /api/biometrics/face/verify.

Here’s the current service code (for Copilot’s context):

# face_service.py
import face_recognition
import numpy as np
import cv2
import uuid
from datetime import datetime
from typing import Dict, Tuple

class FaceService:
    def __init__(self):
        self.known_face_encodings = {}
        self.user_to_template = {}
        self.known_face_metadata = {}
        self.quality_threshold = 0.45

    async def register_face(self, image: np.ndarray, user_id: str) -> Dict:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        face_encoding, metrics = await self._process_face_image(rgb_image)
        if face_encoding is None:
            return {"success": False, "error": "No face detected"}

        template_id = str(uuid.uuid4())
        self.known_face_encodings[template_id] = face_encoding
        self.user_to_template[user_id] = template_id
        self.known_face_metadata[user_id] = {
            "template_id": template_id,
            "registered_at": datetime.now().isoformat()
        }

        return {
            "success": True,
            "user_id": user_id,
            "template_id": template_id,
            "encoding": face_encoding.tolist()
        }

    async def verify_face(self, image: np.ndarray, user_id: str, reference_encoding=None) -> Dict:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        face_encoding, _ = await self._process_face_image(rgb_image)
        if face_encoding is None:
            return {"success": False, "error": "No face detected"}

        ref_encoding = reference_encoding
        if ref_encoding is None:
            tpl = self.user_to_template.get(user_id)
            if tpl and tpl in self.known_face_encodings:
                ref_encoding = self.known_face_encodings[tpl]

        if ref_encoding is None:
            return {"success": False, "error": "No reference encoding"}

        distance = face_recognition.face_distance([ref_encoding], face_encoding)[0]
        is_match = (1 - distance) >= self.quality_threshold
        return {"success": is_match, "match_score": 1 - distance}

🧩 What Copilot should generate:

Copilot should output 3 new files or sections:

1️⃣ database.py
from pymongo import MongoClient
from cryptography.fernet import Fernet
import os, json, numpy as np

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "digital_voting")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
faces_collection = db["faces"]

FERNET_KEY = os.getenv("FERNET_KEY", Fernet.generate_key().decode())
fernet = Fernet(FERNET_KEY.encode())

def encrypt_encoding(encoding: np.ndarray) -> bytes:
    return fernet.encrypt(json.dumps(encoding.tolist()).encode())

def decrypt_encoding(encrypted: bytes) -> np.ndarray:
    return np.array(json.loads(fernet.decrypt(encrypted).decode()))

def save_face_encoding(user_id: str, encoding: np.ndarray, metrics: dict):
    faces_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "encoding": encrypt_encoding(encoding),
            "metrics": metrics,
            "updated_at": datetime.now().isoformat()
        }},
        upsert=True
    )

def get_face_encoding(user_id: str):
    doc = faces_collection.find_one({"user_id": user_id})
    if not doc:
        return None
    return decrypt_encoding(doc["encoding"])

2️⃣ Modify face_service.py (Copilot should update these parts)

Inside register_face():

from database import save_face_encoding

# after computing encoding:
save_face_encoding(user_id, face_encoding, quality_metrics)
print(f"✅ Saved face encoding for {user_id} to MongoDB.")


Inside verify_face():

from database import get_face_encoding

if ref_encoding is None:
    stored_encoding = get_face_encoding(user_id)
    if stored_encoding is not None:
        ref_encoding = stored_encoding
        print(f"🔁 Loaded encoding for {user_id} from MongoDB.")

3️⃣ Add a new helper for voter verification (voting endpoint)

Copilot should add a simple endpoint in your FastAPI main.py:

@app.post("/api/voter/verify-face")
async def verify_voter_face(request: FaceRequest):
    """
    Used during vote registration or authentication to verify live face with stored biometric.
    """
    image_bytes = base64.b64decode(request.image_data.split(",")[1])
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    result = await face_service.verify_face(image, request.user_id)
    return BiometricResponse(
        success=result.get("success", False),
        data=result,
        message="✅ Face verified for voter" if result.get("success") else "❌ Verification failed"
    )

🔐 Expected Behavior After Copilot Generates Code

When a new user registers their face → encoding is saved securely in MongoDB (faces collection).

During voter registration or login → the service loads the encoding from MongoDB and verifies it.

In-memory caching is still active for speed.

If MongoDB connection fails, FastAPI returns a clear 500 error.