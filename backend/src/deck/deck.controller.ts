import { Controller, Get, Delete, Param } from "@nestjs/common";
import { DeckService } from "./deck.service";
import { CardService } from "../card/card.service";

@Controller("decks")
export class DeckController {
  constructor(
    private readonly deckService: DeckService,
    private readonly cardService: CardService,
  ) {}

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const deck = await this.deckService.findOne(id);
    const dueCount = await this.cardService.getDueCount(id);

    return {
      ...deck,
      cardCount: deck.cards?.length || 0,
      dueCount,
    };
  }

  @Get(":id/cards")
  async getCards(@Param("id") deckId: string) {
    return this.cardService.findByDeck(deckId);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    await this.deckService.delete(id);
    return { message: "Deck deleted successfully" };
  }
}
