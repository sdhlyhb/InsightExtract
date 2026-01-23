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


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    page_info: Optional[List[Dict]] = None,
) -> List[Dict[str, any]]:
    """
    Split text into overlapping chunks.
    
    Args:
        text: Text content to chunk
        chunk_size: Target size of each chunk in characters
        chunk_overlap: Number of overlapping characters between chunks
        page_info: Optional list of page information for tracking sources
        
    Returns:
        List of chunks with metadata
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    chunk_id = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Try to break at sentence boundary
        if end < len(text):
            # Look for sentence endings
            for punct in [". ", ".\n", "! ", "!\n", "? ", "?\n"]:
                last_punct = text.rfind(punct, start, end)
                if last_punct != -1:
                    end = last_punct + 1
                    break
        
        chunk_text = text[start:end].strip()
        
        if chunk_text:
            # Estimate token count (rough approximation: 1 token ≈ 4 chars)
            token_count = len(chunk_text) // 4
            
            # Determine page range if page_info provided
            page_from, page_to = None, None
            if page_info:
                char_count = 0
                for page in page_info:
                    page_num = page["page_number"]
                    page_chars = page["char_count"]
                    
                    if char_count <= start < char_count + page_chars:
                        page_from = page_num
                    if char_count <= end <= char_count + page_chars:
                        page_to = page_num
                    
                    char_count += page_chars + 2  # +2 for "\n\n"
                    
                    if page_from and page_to:
                        break
                
                # If chunk spans multiple pages, set page_to
                if page_from and not page_to:
                    page_to = page_from
            
            chunks.append({
                "chunk_id": chunk_id,
                "content": chunk_text,
                "token_count": token_count,
                "page_from": page_from,
                "page_to": page_to,
                "start_char": start,
                "end_char": end,
            })
            
            chunk_id += 1
        
        # Move start position with overlap
        start = end - chunk_overlap if end < len(text) else end
        
        # Prevent infinite loop
        if start >= len(text):
            break
    
    return chunks


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
