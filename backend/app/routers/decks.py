"""Deck endpoints."""
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Card, Deck, Document, FlashcardType
from app.schemas import CardResponse, DeckResponse, DeckCreate

router = APIRouter(prefix="/decks", tags=["decks"])


@router.get("", response_model=List[DeckResponse])
async def list_decks(
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """List all decks with their card counts."""
    result = await db.execute(
        select(Deck).order_by(Deck.created_at.desc())
    )
    decks = result.scalars().all()

    deck_responses = []
    for deck in decks:
        # Count total cards
        card_count_result = await db.execute(
            select(Card).where(Card.deck_id == deck.id)
        )
        cards = card_count_result.scalars().all()
        card_count = len(cards)

        # Count due cards
        from datetime import datetime
        due_count = sum(1 for card in cards if card.due_date <= datetime.utcnow())

        deck_responses.append({
            "id": str(deck.id),
            "document_id": str(deck.document_id) if deck.document_id else None,
            "title": deck.title,
            "card_count": card_count,
            "due_count": due_count,
            "created_at": deck.created_at.isoformat(),
            "tags": deck.tags or [],
        })

    return deck_responses


@router.post("", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
async def create_deck(
    deck_data: DeckCreate = Body(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a new deck with cards."""
    # Validate document exists if provided
    if deck_data.documentId:
        result = await db.execute(
            select(Document).where(Document.id == deck_data.documentId)
        )
        document = result.scalar_one_or_none()
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
    
    # Create deck
    deck = Deck(
        id=uuid4(),
        document_id=deck_data.documentId,
        title=deck_data.title,
        tags=deck_data.tags,
    )
    
    db.add(deck)
    await db.flush()
    
    # Create cards
    from datetime import datetime
    for card_input in deck_data.cards:
        card = Card(
            id=uuid4(),
            deck_id=deck.id,
            type=card_input.type,
            front=card_input.front,
            back=card_input.back,
            tags=card_input.tags,
            ease=2.5,
            interval=0,
            repetition=0,
            due_date=datetime.utcnow(),
            citations=[],
        )
        db.add(card)
    
    await db.commit()
    await db.refresh(deck)
    
    # Load cards to get count
    result = await db.execute(
        select(Card).where(Card.deck_id == deck.id)
    )
    cards = result.scalars().all()
    
    card_count = len(cards)
    due_count = sum(1 for card in cards if card.due_date <= datetime.utcnow())
    
    return {
        "id": deck.id,
        "document_id": deck.document_id,
        "title": deck.title,
        "card_count": card_count,
        "due_count": due_count,
        "tags": deck.tags,
        "created_at": deck.created_at,
    }


@router.get("/{deck_id}", response_model=DeckResponse)
async def get_deck(
    deck_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get deck by ID."""
    result = await db.execute(
        select(Deck)
        .options(selectinload(Deck.cards))
        .where(Deck.id == deck_id)
    )
    deck = result.scalar_one_or_none()

    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found",
        )

    from datetime import datetime
    card_count = len(deck.cards)
    due_count = sum(1 for card in deck.cards if card.due_date <= datetime.utcnow())

    return {
        "id": deck.id,
        "document_id": deck.document_id,
        "title": deck.title,
        "card_count": card_count,
        "due_count": due_count,
        "tags": deck.tags,
        "created_at": deck.created_at,
    }


@router.get("/{deck_id}/cards", response_model=List[CardResponse])
async def get_deck_cards(
    deck_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> List[Card]:
    """Get all cards in a deck."""
    result = await db.execute(
        select(Card)
        .where(Card.deck_id == deck_id)
        .order_by(Card.created_at)
    )
    cards = result.scalars().all()
    return list(cards)


@router.post("/{deck_id}/export")
async def export_deck(
    deck_id: UUID,
    format: str = "csv",
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Export deck to CSV or Anki format."""
    result = await db.execute(
        select(Deck)
        .options(selectinload(Deck.cards))
        .where(Deck.id == deck_id)
    )
    deck = result.scalar_one_or_none()

    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found",
        )

    return {
        "message": f"Export to {format} not yet implemented",
        "deck_id": str(deck_id),
    }
