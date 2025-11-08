from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
import cv2
import face_recognition
import base64
import json
import logging
from services.face_service import FaceService
from utils.quality_check import strict_quality_check
from utils.image_utils import ImageUtils

# ------------------------------------------------------
# MODELS
# ------------------------------------------------------
class BiometricResponse(BaseModel):
    success: bool
    data: dict | None = None
    message: str

class FaceValidationRequest(BaseModel):
    image: str

class FaceValidationResponse(BaseModel):
    success: bool
    quality_metrics: dict | None = None
    error: str | None = None
    face_detected: bool

class FaceRequest(BaseModel):
    user_id: str
    image_data: str  # base64 encoded image
    # Optional reference encoding (list of floats) to compare against
    reference_encoding: Optional[List[float]] = None

# FingerprintRequest removed — service operates as face-only

# ------------------------------------------------------
# APP INITIALIZATION
# ------------------------------------------------------
app = FastAPI(title="Biometric Service", version="2.0.0")

# ------------------------------------------------------
# MIDDLEWARE
# ------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict this later to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# LOGGER
# ------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("biometric-service")

# ------------------------------------------------------
# SERVICE INITIALIZATION
# ------------------------------------------------------
face_service = FaceService()

# Simple in-memory rate limiter for quality-check endpoint (per-IP sliding window)
from time import time
_rl_store: dict = {}
_RL_WINDOW = 60  # seconds
_RL_LIMIT = 8    # allow 8 requests per window per IP

# ------------------------------------------------------
# FACE ENDPOINTS
# ------------------------------------------------------
@app.post("/api/face/validate", response_model=FaceValidationResponse)
async def validate_face(request: FaceValidationRequest):
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image.split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return FaceValidationResponse(
                success=False,
                face_detected=False,
                error="Invalid image data"
            )
        
        # Analyze image quality and detect face
        quality_result = await face_service.analyze_face_quality(image)
        
        if quality_result.get('error'):
            return FaceValidationResponse(
                success=False,
                face_detected=False,
                error=quality_result['error'],
                quality_metrics=quality_result.get('metrics')
            )
        
        return FaceValidationResponse(
            success=True,
            face_detected=True,
            quality_metrics=quality_result['metrics']
        )
        
    except Exception as e:
        logger.error(f"Face validation error: {str(e)}")
        return FaceValidationResponse(
            success=False,
            face_detected=False,
            error=str(e)
        )


@app.post("/api/face/quality-check")
async def face_quality_check(request: FaceValidationRequest):
    """Strict quality check for enrollment. Returns approved boolean and detailed flags."""
    # Rate limiting by remote IP to avoid quality-check floods from the frontend
    try:
        client_host = None
        # FastAPI exposes client remote addr on request.scope
        try:
            client_host = request.scope.get("client")[0]
        except Exception:
            client_host = "unknown"

        now = time()
        window = _rl_store.setdefault(client_host, [])
        # drop expired
        window[:] = [t for t in window if now - t < _RL_WINDOW]
        if len(window) >= _RL_LIMIT:
            # Too many requests
            from fastapi.responses import JSONResponse
            retry_after = int(_RL_WINDOW - (now - window[0])) if window else _RL_WINDOW
            return JSONResponse(status_code=429, content={"detail": "Too Many Requests", "retry_after": retry_after})
        window.append(now)

    except Exception:
        # if rate-limiter fails, continue to run the check (fail-open)
        pass

    try:
        # Use ImageUtils to robustly decode base64 data URLs or raw base64
        try:
            image = ImageUtils.base64_to_image(request.image)
        except Exception:
            # Fallback: try older manual decode path (legacy callers may send bare base64)
            try:
                image_data = base64.b64decode(request.image.split(',')[1])
                nparr = np.frombuffer(image_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception:
                image = None

        if image is None:
            return { 'approved': False, 'message': 'Invalid image data', 'details': { 'face_detected': False } }

        # Use standalone strict_quality_check utility (synchronous)
        result = strict_quality_check(image)
        return result
    except Exception as e:
        logger.error(f"Strict quality check error: {e}")
        return { 'approved': False, 'message': str(e), 'details': {} }


# Alias route kept for backwards compatibility (some callers use /api/biometrics/...)
@app.post("/api/biometrics/face/quality-check")
async def face_quality_check_alias(request: FaceValidationRequest):
    """Alias endpoint that delegates to the strict quality check handler."""
    return await face_quality_check(request)

# ------------------------------------------------------
# FACE REGISTRATION
# ------------------------------------------------------
@app.post("/api/biometrics/face/register", response_model=BiometricResponse)
async def register_face(request: FaceRequest):
    """
    Register a user's face template for later verification.
    """
    try:
        logger.info(f"Face registration request for user: {request.user_id}")
        
        # Convert base64 image to numpy array
        image_bytes = base64.b64decode(request.image_data.split(",")[1])
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Register face using face service
        result = await face_service.register_face(image, request.user_id)

        return BiometricResponse(
            success=True,
            data=result,
            message="✅ Face registered successfully"
        )
        
    except Exception as e:
        logger.error(f"Face registration failed: {e}")
        raise HTTPException(status_code=400, detail=f"Face registration error: {str(e)}")


@app.post("/api/biometrics/face/register-batch", response_model=List[BiometricResponse])
async def register_face_batch(requests: List[FaceRequest]):
    """Batch register faces. Useful for bulk uploader in frontend (alias to single register).

    Returns array of BiometricResponse objects corresponding to inputs.
    """
    results = []
    for req in requests:
        try:
            # reuse existing register_face logic (call service directly)
            image_bytes = base64.b64decode(req.image_data.split(",")[1])
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            res = await face_service.register_face(image, req.user_id)
            results.append(BiometricResponse(success=res.get("success", False), data=res, message=""))
        except Exception as e:
            results.append(BiometricResponse(success=False, data=None, message=str(e)))
    return results

# ------------------------------------------------------
# FACE VERIFICATION
# ------------------------------------------------------
@app.post("/api/biometrics/face/verify", response_model=BiometricResponse)
async def verify_face(request: FaceRequest):
    """
    Verify user's identity by comparing live face capture with stored embedding.
    """
    try:
        logger.info(f"Verifying face for user: {request.user_id}")

        image_bytes = base64.b64decode(request.image_data.split(",")[1])
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Pass optional reference encoding when provided to prefer direct comparison
        result = await face_service.verify_face(image, request.user_id, reference_encoding=getattr(request, 'reference_encoding', None))
        return BiometricResponse(
            success=result.get("success", False),
            data=result,
            message="✅ Face verified successfully" if result.get("success") else "❌ Face verification failed"
        )
    except Exception as e:
        logger.error(f"Face verification failed: {e}")
        raise HTTPException(status_code=400, detail=f"Face verification error: {e}")


@app.post("/api/voter/verify-face", response_model=BiometricResponse)
async def verify_voter_face(request: FaceRequest):
    """
    Used during vote registration or authentication to verify live face with stored biometric.
    """
    try:
        logger.info(f"Voter face verification request for user: {request.user_id}")

        image_bytes = base64.b64decode(request.image_data.split(",")[1])
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        result = await face_service.verify_face(image, request.user_id)
        return BiometricResponse(
            success=result.get("success", False),
            data=result,
            message="✅ Face verified for voter" if result.get("success") else "❌ Verification failed"
        )
    except Exception as e:
        logger.error(f"Voter face verification failed: {e}")
        raise HTTPException(status_code=400, detail=f"Voter face verification error: {e}")

# ------------------------------------------------------
# FINGERPRINT REGISTRATION
# ------------------------------------------------------
# ------------------------------------------------------
# FINGERPRINT VERIFICATION
# ------------------------------------------------------
# Fingerprint endpoints removed — service is face-only

# ------------------------------------------------------
# HEALTH CHECK ENDPOINT
# ------------------------------------------------------
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "biometric",
        "version": "2.0.0"
    }

# ------------------------------------------------------
# ROOT (INFO)
# ------------------------------------------------------
@app.get("/")
async def root_info():
    return {
        "service": "Biometric Authentication API",
        "description": "Face recognition service (fingerprint support removed)",
        "endpoints": [
            "/api/face/validate",
            "/api/biometrics/face/register",
            "/api/biometrics/face/verify",
            "/api/health"
        ]
    }

# ------------------------------------------------------
# MAIN ENTRY
# ------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    # Run biometric service on 8000 by default (backend proxies to this URL)
    PORT = 8000
    logger.info(f"🚀 Starting Biometric Service on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
