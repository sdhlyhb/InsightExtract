import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Document, DocumentStatus } from "./document.entity";
import { CreateDocumentDto } from "./dto/create-document.dto";

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create(createDocumentDto);
    return this.documentRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return this.documentRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<Document> {
    const document = await this.findOne(id);
    document.status = status;
    return this.documentRepository.save(document);
  }

  async updateOutline(
    id: string,
    outline: any,
    mainPoints: string[],
    citations: any[],
  ): Promise<Document> {
    const document = await this.findOne(id);
    document.outline = outline;
    document.mainPoints = mainPoints;
    document.citations = citations;
    return this.documentRepository.save(document);
  }

  async delete(id: string): Promise<void> {
    const result = await this.documentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
  }
}
