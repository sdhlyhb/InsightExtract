import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { CardService } from "./card.service";
import { UpdateCardDto } from "./dto/update-card.dto";
import { ReviewCardDto } from "./dto/review-card.dto";

@Controller("cards")
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.cardService.findOne(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() updateCardDto: UpdateCardDto) {
    return this.cardService.update(id, updateCardDto);
  }

  @Post(":id/review")
  async review(@Param("id") id: string, @Body() reviewCardDto: ReviewCardDto) {
    return this.cardService.review(id, reviewCardDto.quality);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    await this.cardService.delete(id);
    return { message: "Card deleted successfully" };
  }
}
