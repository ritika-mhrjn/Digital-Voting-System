from pymongo import MongoClient
from cryptography.fernet import Fernet
import os
import json
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger("biometric-db")

# Configuration (env-friendly)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "NayaMatDb")

try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    faces_collection = db["faces"]
except Exception as e:
    # Defer connection errors to runtime operations
    client = None
    db = None
    faces_collection = None
    logger.warning(f"Could not create Mongo client: {e}")

# Fernet key for encrypting encodings. Provide FERNET_KEY as base64-encoded 32-byte key.
FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    # Generate a throwaway key for local development (logged at debug level only)
    FERNET_KEY = Fernet.generate_key().decode()
    logger.debug("Generated temporary FERNET_KEY for local use")

fernet = Fernet(FERNET_KEY.encode())


def _ensure_collection():
    if faces_collection is None:
        raise RuntimeError("MongoDB client not initialized. Check MONGO_URI and that Mongo is running.")


def encrypt_encoding(encoding: np.ndarray) -> bytes:
    """Encrypt a numpy encoding (1D array) and return bytes."""
    try:
        arr = np.asarray(encoding).tolist()
        raw = json.dumps(arr).encode()
        return fernet.encrypt(raw)
    except Exception as e:
        logger.exception("Failed to encrypt encoding")
        raise


def decrypt_encoding(encrypted: bytes) -> np.ndarray:
    """Decrypt bytes back into a numpy array."""
    try:
        raw = fernet.decrypt(encrypted)
        arr = json.loads(raw.decode())
        return np.asarray(arr, dtype=float)
    except Exception as e:
        logger.exception("Failed to decrypt encoding")
        raise


def save_face_encoding(user_id: str, encoding: np.ndarray, metrics: dict) -> bool:
    """Save (upsert) encrypted face encoding and metadata into MongoDB.

    Returns True on success, raises on error.
    """
    _ensure_collection()
    try:
        enc_blob = encrypt_encoding(encoding)
        doc = {
            "user_id": str(user_id),
            "encoding": enc_blob,
            "metrics": metrics if metrics is not None else {},
            "updated_at": datetime.utcnow().isoformat(),
        }
        faces_collection.update_one({"user_id": str(user_id)}, {"$set": doc}, upsert=True)
        logger.info(f"Saved face encoding for user {user_id} to MongoDB")
        return True
    except Exception:
        logger.exception("Failed to save face encoding to MongoDB")
        raise


def get_face_encoding(user_id: str):
    """Retrieve and decrypt a face encoding for a user, or return None if not found."""
    _ensure_collection()
    try:
        doc = faces_collection.find_one({"user_id": str(user_id)})
        if not doc:
            return None
        enc = doc.get("encoding")
        if not enc:
            return None
        # pymongo returns Binary type which is bytes-like
        arr = decrypt_encoding(enc)
        return arr
    except Exception:
        logger.exception("Failed to load face encoding from MongoDB")
        raise


def delete_face_encoding(user_id: str) -> bool:
    """Delete stored encoding for a user (cleanup helper)."""
    _ensure_collection()
    try:
        res = faces_collection.delete_one({"user_id": str(user_id)})
        return res.deleted_count > 0
    except Exception:
        logger.exception("Failed to delete face encoding")
        raise
