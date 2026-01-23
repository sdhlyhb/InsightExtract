import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Deck } from "./deck.entity";
import { DeckService } from "./deck.service";
import { DeckController } from "./deck.controller";
import { CardModule } from "../card/card.module";

@Module({
  imports: [TypeOrmModule.forFeature([Deck]), CardModule],
  controllers: [DeckController],
  providers: [DeckService],
  exports: [DeckService],
})
export class DeckModule {}
