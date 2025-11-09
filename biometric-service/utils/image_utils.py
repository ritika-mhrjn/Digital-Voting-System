import base64
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import logging

logger = logging.getLogger(__name__)

def decode_base64_image(base64_str: str):
    """
    Decode a base64-encoded image string to OpenCV image (BGR).
    Returns: numpy array (OpenCV format)
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_str)
        
        # Convert to PIL Image
        pil_image = Image.open(BytesIO(image_data))
        
        # Convert to RGB (handle RGBA)
        if pil_image.mode == 'RGBA':
            pil_image = pil_image.convert('RGB')
        
        # Convert to OpenCV format (BGR)
        cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        return cv_image
    except Exception as e:
        logger.error(f"Image decode error: {str(e)}")
        raise ValueError(f"Failed to decode image: {str(e)}")

def encode_image_to_base64(image) -> str:
    """
    Encode an OpenCV image (BGR) to base64 string (JPEG format).
    """
    try:
        # Convert BGR to RGB for PIL
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)
        
        # Encode to JPEG
        buffered = BytesIO()
        pil_image.save(buffered, format="JPEG", quality=95)
        
        # Encode to base64
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return img_str
    except Exception as e:
        logger.error(f"Image encode error: {str(e)}")
        raise ValueError(f"Failed to encode image: {str(e)}")

def cv2_to_pil(cv_image):
    """Convert OpenCV image (BGR) to PIL Image (RGB)"""
    try:
        rgb_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)
        return pil_image
    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        raise

def pil_to_cv2(pil_image):
    """Convert PIL Image (RGB) to OpenCV image (BGR)"""
    try:
        cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        return cv_image
    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        raise