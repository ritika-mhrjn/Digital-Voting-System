import cv2
import numpy as np
import face_recognition
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def perform_quality_check(image) -> Dict[str, Any]:
    """
    Perform comprehensive quality check on a face image.
    Returns dict with:
      - passed: bool
      - face_detected: bool
      - message: str
      - details: dict with individual quality metrics
    """
    try:
        details = {}
        issues = []
        
        # 1. Face detection
        face_locations = face_recognition.face_locations(image, model="hog")
        face_detected = len(face_locations) > 0
        
        if not face_detected:
            return {
                "passed": False,
                "face_detected": False,
                "message": "No face detected",
                "details": {"face_detected": False}
            }
        
        # Check for multiple faces
        if len(face_locations) > 1:
            issues.append("Multiple faces detected")
            details["multiple_faces"] = True
        else:
            details["multiple_faces"] = False
        
        # 2. Face size (should occupy reasonable portion of image)
        h, w = image.shape[:2]
        face = face_locations[0]
        top, right, bottom, left = face
        face_width = right - left
        face_height = bottom - top
        face_area_ratio = (face_width * face_height) / (w * h)
        
        if face_area_ratio < 0.1:
            issues.append("Face too small in frame")
            details["face_size"] = face_area_ratio
        elif face_area_ratio > 0.7:
            issues.append("Face too large/close")
            details["face_size"] = face_area_ratio
        else:
            details["face_size"] = face_area_ratio
        
        # 3. Brightness check
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        brightness = np.mean(gray) / 255.0
        
        if brightness < 0.2:
            issues.append("Image too dark")
            details["brightness"] = brightness
        elif brightness > 0.95:
            issues.append("Image too bright")
            details["brightness"] = brightness
        else:
            details["brightness"] = brightness
        
        # 4. Contrast check
        contrast = np.std(gray) / 255.0
        if contrast < 0.1:
            issues.append("Low contrast")
            details["contrast"] = contrast
        else:
            details["contrast"] = contrast
        
        # 5. Sharpness check (Laplacian variance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 100:
            issues.append("Image too blurry")
            details["sharpness"] = laplacian_var
        else:
            details["sharpness"] = laplacian_var
        
        # 6. Check if eyes are visible (simplified)
        # Face should span reasonable height in image
        face_height_ratio = face_height / h
        if face_height_ratio < 0.15:
            issues.append("Face region too small")
        else:
            details["forward_facing"] = True
        
        # Determine pass/fail
        passed = len(issues) == 0 and face_detected
        
        return {
            "passed": passed,
            "face_detected": face_detected,
            "message": "; ".join(issues) if issues else "Quality check passed",
            "details": details,
            "issues": issues
        }
        
    except Exception as e:
        logger.error(f"Quality check error: {str(e)}")
        return {
            "passed": False,
            "face_detected": False,
            "message": f"Quality check failed: {str(e)}",
            "details": {}
        }