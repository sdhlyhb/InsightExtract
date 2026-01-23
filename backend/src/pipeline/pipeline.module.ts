import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { Job } from "./job.entity";
import { PipelineService } from "./pipeline.service";
import { PipelineController } from "./pipeline.controller";
import { ProcessingProcessor } from "./processing.processor";
import { DocumentModule } from "../document/document.module";
import { DeckModule } from "../deck/deck.module";
import { CardModule } from "../card/card.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    BullModule.registerQueue({
      name: "processing",
    }),
    DocumentModule,
    DeckModule,
    CardModule,
  ],
  controllers: [PipelineController],
  providers: [PipelineService, ProcessingProcessor],
  exports: [PipelineService],
})
export class PipelineModule {}
