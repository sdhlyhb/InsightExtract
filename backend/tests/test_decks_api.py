"""Integration tests for deck and card API endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Card, Deck, Document, DocumentSourceType, DocumentKind


@pytest.mark.asyncio
async def test_create_deck(client: AsyncClient, db_session: AsyncSession):
    """Test creating a new deck."""
    payload = {
        "title": "Test Deck",
        "tags": ["test", "sample"]
    }
    
    response = await client.post("/api/decks", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Deck"
    assert "id" in data
    assert data["tags"] == ["test", "sample"]


@pytest.mark.asyncio
async def test_list_decks(client: AsyncClient, db_session: AsyncSession):
    """Test listing all decks."""
    # Create some decks
    await client.post("/api/decks", json={"title": "Deck 1", "tags": []})
    await client.post("/api/decks", json={"title": "Deck 2", "tags": []})
    
    response = await client.get("/api/decks")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    assert any(d["title"] == "Deck 1" for d in data)
    assert any(d["title"] == "Deck 2" for d in data)


@pytest.mark.asyncio
async def test_get_deck_by_id(client: AsyncClient, db_session: AsyncSession):
    """Test retrieving a specific deck."""
    create_response = await client.post(
        "/api/decks",
        json={"title": "Test Deck", "tags": ["test"]}
    )
    deck_id = create_response.json()["id"]
    
    response = await client.get(f"/api/decks/{deck_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == deck_id
    assert data["title"] == "Test Deck"


@pytest.mark.asyncio
async def test_update_deck(client: AsyncClient, db_session: AsyncSession):
    """Test updating a deck (skip - not implemented in API)."""
    pytest.skip("PATCH /decks/{id} endpoint not implemented in API")


@pytest.mark.asyncio
async def test_delete_deck(client: AsyncClient, db_session: AsyncSession):
    """Test deleting a deck (skip - not implemented in API)."""
    pytest.skip("DELETE /decks/{id} endpoint not implemented in API")


@pytest.mark.asyncio
async def test_create_card(client: AsyncClient, db_session: AsyncSession):
    """Test creating a flashcard within deck creation."""
    # Create deck with cards
    deck_response = await client.post(
        "/api/decks",
        json={
            "title": "Test Deck",
            "tags": [],
            "cards": [
                {
                    "type": "qa",
                    "front": "What is 2+2?",
                    "back": "4",
                    "tags": ["math"]
                }
            ]
        }
    )
    
    assert deck_response.status_code == 201
    data = deck_response.json()
    assert data["card_count"] >= 1
    assert data["title"] == "Test Deck"


@pytest.mark.asyncio
async def test_get_deck_cards(client: AsyncClient, db_session: AsyncSession):
    """Test retrieving all cards in a deck."""
    # Create deck with cards
    deck_response = await client.post(
        "/api/decks",
        json={
            "title": "Test Deck",
            "tags": [],
            "cards": [
                {"type": "qa", "front": "Question 1", "back": "Answer 1", "tags": []},
                {"type": "qa", "front": "Question 2", "back": "Answer 2", "tags": []}
            ]
        }
    )
    deck_id = deck_response.json()["id"]
    
    response = await client.get(f"/api/decks/{deck_id}/cards")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


@pytest.mark.asyncio
async def test_update_card(client: AsyncClient, db_session: AsyncSession):
    """Test updating a flashcard."""
    # Create deck with card
    deck_response = await client.post(
        "/api/decks",
        json={
            "title": "Test Deck",
            "tags": [],
            "cards": [{"type": "qa", "front": "Original Question", "back": "Original Answer", "tags": []}]
        }
    )
    deck_id = deck_response.json()["id"]
    
    # Get the card ID
    cards_response = await client.get(f"/api/decks/{deck_id}/cards")
    card_id = cards_response.json()[0]["id"]
    
    # Update card
    update_payload = {
        "front": "Updated Question",
        "back": "Updated Answer"
    }
    
    response = await client.patch(f"/api/cards/{card_id}", json=update_payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["front"] == "Updated Question"
    assert data["back"] == "Updated Answer"


@pytest.mark.asyncio
async def test_delete_card(client: AsyncClient, db_session: AsyncSession):
    """Test deleting a flashcard."""
    # Create deck with card
    deck_response = await client.post(
        "/api/decks",
        json={
            "title": "Test Deck",
            "tags": [],
            "cards": [{"type": "qa", "front": "Question", "back": "Answer", "tags": []}]
        }
    )
    deck_id = deck_response.json()["id"]
    
    # Get the card ID
    cards_response = await client.get(f"/api/decks/{deck_id}/cards")
    card_id = cards_response.json()[0]["id"]
    
    response = await client.delete(f"/api/cards/{card_id}")
    
    assert response.status_code == 204
    
    # Verify deletion by checking deck cards
    get_response = await client.get(f"/api/decks/{deck_id}/cards")
    assert get_response.status_code == 200
    assert len(get_response.json()) == 0  # Card should be deleted


@pytest.mark.asyncio
async def test_review_card(client: AsyncClient, db_session: AsyncSession):
    """Test reviewing a card (SRS update)."""
    # Create deck with card
    deck_response = await client.post(
        "/api/decks",
        json={
            "title": "Test Deck",
            "tags": [],
            "cards": [{"type": "qa", "front": "Question", "back": "Answer", "tags": []}]
        }
    )
    deck_id = deck_response.json()["id"]
    
    # Get the card ID
    cards_response = await client.get(f"/api/decks/{deck_id}/cards")
    card_id = cards_response.json()[0]["id"]
    
    # Review with quality rating
    review_payload = {"quality": 4}
    
    response = await client.post(
        f"/api/cards/{card_id}/review",
        json=review_payload
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "interval" in data
    assert "ease" in data
    assert data["interval"] > 0  # Interval should increase after review
