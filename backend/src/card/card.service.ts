import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual } from "typeorm";
import { Card } from "./card.entity";
import { UpdateCardDto } from "./dto/update-card.dto";

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
  ) {}

  async create(cardData: Partial<Card>): Promise<Card> {
    const card = this.cardRepository.create(cardData);
    return this.cardRepository.save(card);
  }

  async findByDeck(deckId: string): Promise<Card[]> {
    return this.cardRepository.find({
      where: { deckId },
      order: { createdAt: "ASC" },
    });
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id } });
    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }
    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto): Promise<Card> {
    const card = await this.findOne(id);
    Object.assign(card, updateCardDto);
    return this.cardRepository.save(card);
  }

  async review(id: string, quality: number): Promise<Card> {
    const card = await this.findOne(id);

    // SM-2 algorithm implementation
    const sm2Result = this.calculateSM2(
      card.ease,
      card.interval,
      card.repetition,
      quality,
    );

    card.ease = sm2Result.ease;
    card.interval = sm2Result.interval;
    card.repetition = sm2Result.repetition;
    card.lastReviewedAt = new Date();

    // Calculate next due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + sm2Result.interval);
    card.dueDate = dueDate;

    return this.cardRepository.save(card);
  }

  async getDueCount(deckId: string): Promise<number> {
    return this.cardRepository.count({
      where: {
        deckId,
        dueDate: LessThanOrEqual(new Date()),
      },
    });
  }

  async getDueCards(deckId: string): Promise<Card[]> {
    return this.cardRepository.find({
      where: {
        deckId,
        dueDate: LessThanOrEqual(new Date()),
      },
      order: { dueDate: "ASC" },
    });
  }

  private calculateSM2(
    ease: number,
    interval: number,
    repetition: number,
    quality: number,
  ): { ease: number; interval: number; repetition: number } {
    if (quality < 3) {
      // Failed - reset
      return {
        ease: Math.max(1.3, ease - 0.2),
        interval: 0,
        repetition: 0,
      };
    }

    // Passed
    let newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEase = Math.max(1.3, newEase);

    let newInterval: number;
    let newRepetition = repetition + 1;

    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEase);
    }

    return {
      ease: newEase,
      interval: newInterval,
      repetition: newRepetition,
    };
  }

  async delete(id: string): Promise<void> {
    const result = await this.cardRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }
  }
}
