import { Processor, Process } from "@nestjs/bull";
import { Job as BullJob } from "bull";
import { DocumentService } from "../document/document.service";
import { DeckService } from "../deck/deck.service";
import { CardService } from "../card/card.service";
import { PipelineService } from "./pipeline.service";
import { DocumentStatus } from "../document/document.entity";
import { CardType } from "../card/card.entity";

@Processor("processing")
export class ProcessingProcessor {
  constructor(
    private documentService: DocumentService,
    private deckService: DeckService,
    private cardService: CardService,
    private pipelineService: PipelineService,
  ) {}

  @Process("process-document")
  async processDocument(job: BullJob<{ jobId: string; documentId: string }>) {
    const { jobId, documentId } = job.data;

    try {
      await this.pipelineService.updateJobProgress(
        jobId,
        10,
        "Starting extraction...",
      );

      const document = await this.documentService.findOne(documentId);
      await this.documentService.updateStatus(
        documentId,
        DocumentStatus.PROCESSING,
      );

      // Simulate extraction and processing
      await this.pipelineService.updateJobProgress(
        jobId,
        30,
        "Extracting text...",
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate mock outline and main points
      await this.pipelineService.updateJobProgress(
        jobId,
        60,
        "Generating outline...",
      );

      const mockOutline = this.generateMockOutline(document.rawText);
      const mockMainPoints = this.generateMockMainPoints(document.rawText);
      const mockCitations = this.generateMockCitations();

      await this.documentService.updateOutline(
        documentId,
        mockOutline,
        mockMainPoints,
        mockCitations,
      );

      await this.pipelineService.updateJobProgress(jobId, 90, "Finalizing...");
      await this.documentService.updateStatus(
        documentId,
        DocumentStatus.COMPLETED,
      );

      await this.pipelineService.completeJob(jobId);
    } catch (error) {
      await this.documentService.updateStatus(
        documentId,
        DocumentStatus.FAILED,
      );
      await this.pipelineService.failJob(jobId, error.message);
    }
  }

  @Process("generate-flashcards")
  async generateFlashcards(
    job: BullJob<{ jobId: string; documentId: string }>,
  ) {
    const { jobId, documentId } = job.data;

    try {
      await this.pipelineService.updateJobProgress(
        jobId,
        10,
        "Analyzing document...",
      );

      const document = await this.documentService.findOne(documentId);

      await this.pipelineService.updateJobProgress(
        jobId,
        30,
        "Generating flashcards...",
      );

      // Create a deck
      const deck = await this.deckService.create(
        documentId,
        `${document.title} - Flashcards`,
        ["General"],
      );

      // Generate mock flashcards
      const flashcards = this.generateMockFlashcards(document.rawText);

      await this.pipelineService.updateJobProgress(
        jobId,
        60,
        "Saving flashcards...",
      );

      for (const flashcard of flashcards) {
        await this.cardService.create({
          ...flashcard,
          deckId: deck.id,
        });
      }

      await this.pipelineService.updateJobProgress(jobId, 90, "Finalizing...");
      await this.pipelineService.completeJob(jobId, { deckId: deck.id });
    } catch (error) {
      await this.pipelineService.failJob(jobId, error.message);
    }
  }

  private generateMockOutline(text: string): any[] {
    return [
      {
        title: "1. Introduction",
        page: 1,
        children: [
          { title: "1.1 Background", page: 1 },
          { title: "1.2 Purpose", page: 2 },
        ],
      },
      {
        title: "2. Main Content",
        page: 3,
        children: [
          { title: "2.1 Key Concepts", page: 3 },
          { title: "2.2 Analysis", page: 5 },
        ],
      },
      {
        title: "3. Conclusion",
        page: 7,
      },
    ];
  }

  private generateMockMainPoints(text: string): string[] {
    const words = text?.split(" ").slice(0, 50).join(" ") || "No content";
    return [
      `Key point extracted from document: ${words.substring(0, 100)}...`,
      "This document contains important information about the subject matter",
      "Further analysis reveals critical insights",
    ];
  }

  private generateMockCitations(): any[] {
    return [
      {
        id: "1",
        page: 1,
        quote: "Important quote from the document",
        context: "Section 1",
      },
      {
        id: "2",
        page: 3,
        quote: "Another significant passage",
        context: "Section 2",
      },
    ];
  }

  private generateMockFlashcards(text: string): any[] {
    return [
      {
        type: CardType.QA,
        front: "What is the main topic of this document?",
        back: text?.substring(0, 100) || "The document discusses key concepts",
        citations: [{ id: "1", page: 1, quote: text?.substring(0, 50) || "" }],
        tags: ["General"],
      },
      {
        type: CardType.QA,
        front: "What are the key takeaways?",
        back: "The main takeaways include understanding core principles and their applications",
        citations: [{ id: "2", page: 2, quote: "Core principles" }],
        tags: ["General"],
      },
      {
        type: CardType.CLOZE,
        front: "The document primarily focuses on [...]",
        back: "key concepts and analysis",
        citations: [],
        tags: ["General"],
      },
    ];
  }
}
