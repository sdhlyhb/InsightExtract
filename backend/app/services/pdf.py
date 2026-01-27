"""PDF processing service."""
import hashlib
from io import BytesIO
from typing import Dict, List, Optional

import pdfplumber


def extract_text_from_pdf(content: bytes) -> Dict[str, any]:
    """
    Extract text content from PDF bytes.
    
    Args:
        content: PDF file content as bytes
        
    Returns:
        Dictionary with extracted text, page count, and metadata
    """
    result = {
        "text": "",
        "pages": [],
        "page_count": 0,
        "metadata": {},
    }
    
    try:
        with pdfplumber.open(BytesIO(content)) as pdf:
            result["page_count"] = len(pdf.pages)
            result["metadata"] = pdf.metadata or {}
            
            for i, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text() or ""
                result["pages"].append({
                    "page_number": i,
                    "text": page_text,
                    "char_count": len(page_text),
                })
                result["text"] += page_text + "\n\n"
            
            result["text"] = result["text"].strip()
            
            # Check if any text was extracted
            if not result["text"]:
                raise ValueError(
                    "No text content found in PDF. "
                    "This might be a scanned document (image-based PDF) without a text layer. "
                    "OCR processing would be needed to extract text from such documents."
                )
    except ValueError:
        # Re-raise ValueError with our custom message
        raise
    except Exception as e:
        raise ValueError(f"Failed to extract PDF content: {str(e)}")
    
    return result


def calculate_file_hash(content: bytes) -> str:
    """Calculate SHA-256 hash of file content."""
    return hashlib.sha256(content).hexdigest()


def extract_citations(text: str, page_number: int) -> List[Dict[str, any]]:
    """
    Extract potential citations/quotes from text.
    
    Args:
        text: Text content
        page_number: Page number for citation reference
        
    Returns:
        List of citation dictionaries
    """
    citations = []
    
    # Simple quote extraction (can be enhanced with NLP)
    sentences = text.split(". ")
    
    for i, sentence in enumerate(sentences):
        sentence = sentence.strip()
        if len(sentence) > 50:  # Only substantial sentences
            citations.append({
                "text": sentence,
                "page": page_number,
                "position": i,
            })
    
    return citations
