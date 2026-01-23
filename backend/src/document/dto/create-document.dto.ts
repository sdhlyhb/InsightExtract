import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { DocumentSourceType } from "./document.entity";

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(DocumentSourceType)
  sourceType: DocumentSourceType;

  @IsString()
  @IsOptional()
  rawText?: string;
}
