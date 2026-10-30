"""Optical Character Recognition (OCR) Engine for Scanned Documents and Images."""

import io
from PIL import Image

from app.core.logging import get_logger

logger = get_logger(__name__)


class OCREngine:
    """Extracts text from scanned pages and raster images."""

    def extract_text_from_image(self, image_bytes: bytes) -> str:
        """Extract text from raw image bytes with fallback."""
        if not image_bytes:
            return ""

        try:
            # Verify valid image using Pillow
            img = Image.open(io.BytesIO(image_bytes))
            # If pytesseract is available on system, run it; otherwise extract image metadata
            try:
                import pytesseract
                text = pytesseract.image_to_string(img)
                if text.strip():
                    return text.strip()
            except (ImportError, Exception):
                pass

            return f"[Extracted Image: format={img.format}, size={img.size[0]}x{img.size[1]}]"
        except Exception as e:
            logger.warning("ocr_extraction_failed", error=str(e))
            return ""

