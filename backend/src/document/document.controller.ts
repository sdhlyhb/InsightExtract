import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentService } from "./document.service";
import { DeckService } from "../deck/deck.service";
import { PipelineService } from "../pipeline/pipeline.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { DocumentSourceType } from "./document.entity";
import * as pdfParse from "pdf-parse";

@Controller("documents")
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly deckService: DeckService,
    private readonly pipelineService: PipelineService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body("sourceType") sourceType?: string,
    @Body("rawText") rawText?: string,
  ) {
    let documentData: CreateDocumentDto;

    if (file) {
      // Handle PDF upload
      const pdfData = await pdfParse(file.buffer);
      documentData = {
        title: file.originalname,
        sourceType: DocumentSourceType.PDF,
        rawText: pdfData.text,
      };
    } else if (rawText) {
      // Handle text paste
      documentData = {
        title: "Pasted Text Document",
        sourceType: DocumentSourceType.TEXT,
        rawText,
      };
    } else {
      throw new BadRequestException("Either file or rawText must be provided");
    }

    const document = await this.documentService.create(documentData);

    // Trigger processing pipeline
    await this.pipelineService.startProcessing(document.id);

    return document;
  }

  @Get()
  async findAll() {
    return this.documentService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.documentService.findOne(id);
  }

  @Get(":id/outline")
  async getOutline(@Param("id") id: string) {
    const document = await this.documentService.findOne(id);
    return {
      documentId: document.id,
      mainPoints: document.mainPoints || [],
      outline: document.outline || [],
      citations: document.citations || [],
    };
  }

  @Get(":id/decks")
  async getDecks(@Param("id") id: string) {
    return this.deckService.findByDocument(id);
  }

  @Post(":id/generate")
  async generateFlashcards(@Param("id") id: string) {
    const jobId = await this.pipelineService.generateFlashcards(id);
    return { jobId };
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    await this.documentService.delete(id);
    return { message: "Document deleted successfully" };
  }
}
