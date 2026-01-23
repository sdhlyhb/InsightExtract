import { IsString, IsOptional, IsArray, IsEnum } from "class-validator";
import { CardType } from "../card.entity";

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  front?: string;

  @IsString()
  @IsOptional()
  back?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsEnum(CardType)
  @IsOptional()
  type?: CardType;
}
