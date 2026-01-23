import { IsInt, IsNumber, Max, Min } from "class-validator";

export class ReviewCardDto {
  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(5)
  quality: number;
}
