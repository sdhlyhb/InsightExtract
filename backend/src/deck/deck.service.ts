import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Deck } from "./deck.entity";

@Injectable()
export class DeckService {
  constructor(
    @InjectRepository(Deck)
    private deckRepository: Repository<Deck>,
  ) {}

  async create(
    documentId: string,
    title: string,
    tags: string[],
  ): Promise<Deck> {
    const deck = this.deckRepository.create({
      documentId,
      title,
      tags,
    });
    return this.deckRepository.save(deck);
  }

  async findByDocument(documentId: string): Promise<Deck[]> {
    return this.deckRepository.find({
      where: { documentId },
      relations: ["cards"],
    });
  }

  async findOne(id: string): Promise<Deck> {
    const deck = await this.deckRepository.findOne({
      where: { id },
      relations: ["cards"],
    });
    if (!deck) {
      throw new NotFoundException(`Deck with ID ${id} not found`);
    }
    return deck;
  }

  async delete(id: string): Promise<void> {
    const result = await this.deckRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Deck with ID ${id} not found`);
    }
  }
}
