"""Integration tests for document API endpoints."""
import json
from io import BytesIO

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_extract_text_from_pdf(client: AsyncClient, sample_pdf_content: bytes):
    """Test PDF text extraction endpoint."""
    files = {
        "file": ("test.pdf", BytesIO(sample_pdf_content), "application/pdf")
    }
    
    response = await client.post("/api/documents/extract-text", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "text" in data
    assert "filename" in data
    assert "char_count" in data
    assert data["filename"] == "test.pdf"
    assert len(data["text"]) > 0


@pytest.mark.asyncio
async def test_extract_text_unsupported_format(client: AsyncClient):
    """Test that unsupported file formats are rejected."""
    files = {
        "file": ("test.txt", BytesIO(b"plain text"), "text/plain")
    }
    
    response = await client.post("/api/documents/extract-text", files=files)
    
    assert response.status_code == 400
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_analyze_text(client: AsyncClient, sample_text: str):
    """Test text analysis endpoint."""
    pytest.skip("Requires OpenAI API key and makes external API calls")


@pytest.mark.asyncio
async def test_analyze_text_empty(client: AsyncClient):
    """Test that empty text is rejected."""
    payload = {
        "text": "",
        "max_points": 5
    }
    
    response = await client.post(
        "/api/documents/analyze-text",
        json=payload
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_save_summary_document(client: AsyncClient, sample_text: str):
    """Test saving a summary document."""
    pytest.skip("Depends on analyze_text which requires OpenAI API")
    # First analyze text
    analyze_response = await client.post(
        "/api/documents/analyze-text",
        json={"text": sample_text, "max_points": 5}
    )
    analysis_result = analyze_response.json()
    
    # Save summary
    payload = {
        "name": "test-summary.json",
        "mimeType": "application/json",
        "size": len(json.dumps(analysis_result)),
        "content": json.dumps(analysis_result),
        "sourceFileName": "test-document.pdf",
        "meta": {"kind": "summary"}
    }
    
    response = await client.post(
        "/api/documents/flashcards",
        json=payload
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    # Check the document was created
    assert "created_at" in data


@pytest.mark.asyncio
async def test_get_recent_documents(client: AsyncClient, sample_text: str):
    """Test retrieving recent documents."""
    # Create a summary document first
    analyze_response = await client.post(
        "/api/documents/analyze-text",
        json={"text": sample_text, "max_points": 5}
    )
    analysis_result = analyze_response.json()
    
    await client.post(
        "/api/documents/flashcards",
        json={
            "name": "test-summary.json",
            "mimeType": "application/json",
            "size": len(json.dumps(analysis_result)),
            "content": json.dumps(analysis_result),
            "sourceFileName": "test.pdf",
            "meta": {"kind": "summary"}
        }
    )
    
    # Get recent documents
    response = await client.get("/api/documents/recent?limit=10")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["title"] == "test-summary.json"
    assert data[0]["kind"] == "summary"


@pytest.mark.asyncio
async def test_get_document_by_id(client: AsyncClient, sample_text: str):
    """Test retrieving a specific document by ID."""
    # Create document
    analyze_response = await client.post(
        "/api/documents/analyze-text",
        json={"text": sample_text, "max_points": 5}
    )
    analysis_result = analyze_response.json()
    
    create_response = await client.post(
        "/api/documents/flashcards",
        json={
            "name": "test-summary.json",
            "mimeType": "application/json",
            "size": len(json.dumps(analysis_result)),
            "content": json.dumps(analysis_result),
            "sourceFileName": "test.pdf",
            "meta": {"kind": "summary"}
        }
    )
    doc_id = create_response.json()["id"]
    
    # Get document
    response = await client.get(f"/api/documents/{doc_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == doc_id
    assert data["title"] == "test-summary.json"
    assert "content" in data


@pytest.mark.asyncio
async def test_delete_document(client: AsyncClient, sample_text: str):
    """Test deleting a document."""
    # Create document
    analyze_response = await client.post(
        "/api/documents/analyze-text",
        json={"text": sample_text, "max_points": 5}
    )
    analysis_result = analyze_response.json()
    
    create_response = await client.post(
        "/api/documents/flashcards",
        json={
            "name": "test-summary.json",
            "mimeType": "application/json",
            "size": len(json.dumps(analysis_result)),
            "content": json.dumps(analysis_result),
            "sourceFileName": "test.pdf",
            "meta": {"kind": "summary"}
        }
    )
    doc_id = create_response.json()["id"]
    
    # Delete document
    response = await client.delete(f"/api/documents/{doc_id}")
    
    assert response.status_code == 204
    
    # Verify deletion
    get_response = await client.get(f"/api/documents/{doc_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_save_flashcards_csv(client: AsyncClient):
    """Test saving flashcards CSV."""
    csv_content = "Front,Back\nQuestion 1,Answer 1\nQuestion 2,Answer 2"
    
    payload = {
        "name": "test-flashcards.csv",
        "mimeType": "text/csv",
        "size": len(csv_content),
        "content": csv_content,
        "sourceFileName": "test.pdf",
        "meta": {"cardCount": 2}
    }
    
    response = await client.post(
        "/api/documents/flashcards",
        json=payload
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    # Check the document was created (response uses camelCase)
    assert "createdAt" in data or "created_at" in data


@pytest.mark.asyncio
async def test_invalid_mime_type(client: AsyncClient):
    """Test that invalid MIME types are rejected."""
    payload = {
        "name": "test.txt",
        "mimeType": "text/plain",  # Invalid MIME type
        "size": 100,
        "content": "test content",
        "sourceFileName": "test.pdf",
        "meta": {}
    }
    
    response = await client.post(
        "/api/documents/flashcards",
        json=payload
    )
    
    assert response.status_code == 400
    assert "MIME type" in response.json()["detail"]
