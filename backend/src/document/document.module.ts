import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Document } from "./document.entity";
import { DocumentService } from "./document.service";
import { DocumentController } from "./document.controller";
import { PipelineModule } from "../pipeline/pipeline.module";
import { DeckModule } from "../deck/deck.module";

@Module({
  imports: [TypeOrmModule.forFeature([Document]), PipelineModule, DeckModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
