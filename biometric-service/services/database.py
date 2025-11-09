from pymongo import MongoClient
from cryptography.fernet import Fernet
import os
import logging
import json

logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "electoral_system")

try:
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    faces_collection = db["faces"]
    logger.info("Connected to MongoDB")
except Exception as e:
    logger.error(f"MongoDB connection failed: {str(e)}")
    raise

# Encryption key for storing face encodings
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "your-secret-key-here").encode()
cipher_suite = Fernet(ENCRYPTION_KEY if len(ENCRYPTION_KEY) == 44 else Fernet.generate_key())

def encrypt_encoding(encoding):
    """Encrypt a face encoding before storing"""
    try:
        encoding_str = json.dumps(encoding)
        encrypted = cipher_suite.encrypt(encoding_str.encode())
        return encrypted.decode()
    except Exception as e:
        logger.error(f"Encryption error: {str(e)}")
        return None

def decrypt_encoding(encrypted_encoding):
    """Decrypt a stored face encoding"""
    try:
        decrypted = cipher_suite.decrypt(encrypted_encoding.encode())
        encoding = json.loads(decrypted.decode())
        return encoding
    except Exception as e:
        logger.error(f"Decryption error: {str(e)}")
        return None

def save_face_encoding(user_id: str, face_id: str, encoding):
    """
    Save a face encoding to the database.
    """
    try:
        encrypted_encoding = encrypt_encoding(encoding)
        
        doc = {
            "user_id": str(user_id),
            "face_id": str(face_id),
            "encoding": encrypted_encoding,
            "enrolled_at": __import__('datetime').datetime.utcnow()
        }
        
        result = faces_collection.insert_one(doc)
        logger.info(f"Face saved for user {user_id} with ID {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Save face encoding error: {str(e)}")
        raise

def get_face_encoding(user_id: str):
    """
    Retrieve the most recent face encoding for a user.
    """
    try:
        doc = faces_collection.find_one(
            {"user_id": str(user_id)},
            sort=[("enrolled_at", -1)]
        )
        
        if doc:
            encrypted = doc.get("encoding")
            if encrypted:
                encoding = decrypt_encoding(encrypted)
                return encoding
        
        logger.warning(f"No face encoding found for user {user_id}")
        return None
    except Exception as e:
        logger.error(f"Get face encoding error: {str(e)}")
        return None

def face_exists(user_id: str) -> bool:
    """
    Check if a face encoding exists for a user.
    """
    try:
        doc = faces_collection.find_one({"user_id": str(user_id)})
        return doc is not None
    except Exception as e:
        logger.error(f"Face exists check error: {str(e)}")
        return False

def delete_face_encoding(user_id: str):
    """
    Delete all face encodings for a user.
    """
    try:
        result = faces_collection.delete_many({"user_id": str(user_id)})
        logger.info(f"Deleted {result.deleted_count} face encoding(s) for user {user_id}")
        return result.deleted_count
    except Exception as e:
        logger.error(f"Delete face encoding error: {str(e)}")
        raise

def get_all_encodings_for_user(user_id: str):
    """
    Retrieve all face encodings for a user (for batch verification).
    """
    try:
        docs = list(faces_collection.find({"user_id": str(user_id)}))
        encodings = []
        for doc in docs:
            encrypted = doc.get("encoding")
            if encrypted:
                encoding = decrypt_encoding(encrypted)
                if encoding:
                    encodings.append(encoding)
        
        logger.info(f"Retrieved {len(encodings)} face encoding(s) for user {user_id}")
        return encodings
    except Exception as e:
        logger.error(f"Get all encodings error: {str(e)}")
        return []