"""Card endpoints."""
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Card, Review
from app.schemas import CardResponse, CardReview, CardUpdate

router = APIRouter(prefix="/cards", tags=["cards"])


def calculate_sm2(ease: float, interval: int, repetition: int, quality: int):
    """SM-2 algorithm implementation."""
    if quality < 3:
        new_repetition = 0
        new_interval = 0
        new_ease = ease
    else:
        new_repetition = repetition + 1
        new_ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ease = max(1.3, new_ease)
        
        if new_repetition == 1:
            new_interval = 1
        elif new_repetition == 2:
            new_interval = 6
        else:
            new_interval = round(interval * new_ease)
    
    from datetime import timedelta
    due_date = datetime.utcnow() + timedelta(days=new_interval)
    return new_ease, new_interval, new_repetition, due_date


@router.patch("/{card_id}", response_model=CardResponse)
async def update_card(
    card_id: UUID,
    card_update: CardUpdate,
    db: AsyncSession = Depends(get_db),
) -> Card:
    """Update card content."""
    result = await db.execute(
        select(Card).where(Card.id == card_id)
    )
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found",
        )

    if card_update.front is not None:
        card.front = card_update.front
    if card_update.back is not None:
        card.back = card_update.back
    if card_update.tags is not None:
        card.tags = card_update.tags

    card.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(card)

    return card


@router.post("/{card_id}/review", response_model=CardResponse)
async def review_card(
    card_id: UUID,
    review: CardReview,
    db: AsyncSession = Depends(get_db),
) -> Card:
    """Record a card review and update SRS parameters."""
    result = await db.execute(
        select(Card).where(Card.id == card_id)
    )
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found",
        )

    new_ease, new_interval, new_repetition, new_due_date = calculate_sm2(
        card.ease,
        card.interval,
        card.repetition,
        review.quality,
    )

    card.ease = new_ease
    card.interval = new_interval
    card.repetition = new_repetition
    card.due_date = new_due_date
    card.last_reviewed_at = datetime.utcnow()
    card.updated_at = datetime.utcnow()

    review_record = Review(
        card_id=card.id,
        quality=review.quality,
        ease=new_ease,
        interval=new_interval,
        repetition=new_repetition,
    )
    db.add(review_record)

    await db.commit()
    await db.refresh(card)

    return card
