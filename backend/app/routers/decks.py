"""Deck endpoints."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Card, Deck
from app.schemas import CardResponse, DeckResponse

router = APIRouter(prefix="/decks", tags=["decks"])


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
