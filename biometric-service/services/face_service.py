import face_recognition
import numpy as np
import logging
from services.database import save_face_encoding, get_face_encoding as get_stored_face_encoding, face_exists
from utils.quality_check import perform_quality_check
from utils.image_utils import cv2_to_pil
import uuid

logger = logging.getLogger(__name__)

def extract_face_encoding(image):
    """
    Extract face encoding from an image.
    Returns: list (128-d face encoding) or None if face not detected
    """
    try:
        # Detect face locations and encodings
        face_locations = face_recognition.face_locations(image, model="hog")
        if not face_locations:
            logger.warning("No face detected in image")
            return None
        
        # Get encoding for the first (primary) face
        encodings = face_recognition.face_encodings(image, face_locations)
        if encodings:
            return encodings[0].tolist()  # Convert numpy array to list
        
        return None
    except Exception as e:
        logger.error(f"Face encoding error: {str(e)}")
        return None

def register_face(user_id: str, image):
    """
    Register a face for a user.
    """
    try:
        # Check image quality first
        quality_result = perform_quality_check(image)
        if not quality_result.get("face_detected"):
            return {
                "success": False,
                "message": "No face detected in image",
                "face_id": None,
                "encoding": None
            }
        
        # Extract face encoding
        encoding = extract_face_encoding(image)
        if encoding is None:
            return {
                "success": False,
                "message": "Failed to generate face encoding",
                "face_id": None,
                "encoding": None
            }
        
        # Generate unique face template ID
        face_id = str(uuid.uuid4())
        
        # Save to database (bubble up errors so callers know if persistence failed)
        save_face_encoding(user_id, face_id, encoding)
        
        logger.info(f"Face registered for user {user_id} with face_id {face_id}")
        
        return {
            "success": True,
            "message": "Face registered successfully",
            "face_id": face_id,
            "encoding": encoding
        }
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return {
            "success": False,
            "message": f"Registration failed: {str(e)}",
            "face_id": None,
            "encoding": None
        }

def verify_face(user_id: str, image, reference_encoding=None):
    """
    Verify a face against stored template for a user.
    """
    try:
        # Check image quality
        quality_result = perform_quality_check(image)
        if not quality_result.get("face_detected"):
            return {
                "verified": False,
                "message": "No face detected in image",
                "confidence": 0
            }
        
        # Extract face encoding from probe image
        probe_encoding = extract_face_encoding(image)
        if probe_encoding is None:
            return {
                "verified": False,
                "message": "Failed to generate face encoding from probe image",
                "confidence": 0
            }
        
        # Get reference encoding
        if reference_encoding is None:
            reference_encoding = get_stored_face_encoding(user_id)
        
        if reference_encoding is None:
            return {
                "verified": False,
                "message": "No stored face template found for user",
                "confidence": 0
            }
        
        # Convert to numpy arrays for comparison
        probe_enc = np.array(probe_encoding)
        ref_enc = np.array(reference_encoding)
        
        # Compute face distance (lower = more similar)
        distance = face_recognition.face_distance([ref_enc], probe_enc)[0]
        
        # Threshold for verification (default 0.6)
        threshold = 0.6
        verified = distance < threshold
        confidence = 1 - distance  # Convert distance to confidence (0-1)
        
        logger.info(f"Verification for user {user_id}: distance={distance:.4f}, verified={verified}, confidence={confidence:.4f}")
        
        return {
            "verified": verified,
            "message": "Face verified successfully" if verified else "Face verification failed",
            "confidence": float(confidence),
            "distance": float(distance)
        }
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        return {
            "verified": False,
            "message": f"Verification failed: {str(e)}",
            "confidence": 0
        }