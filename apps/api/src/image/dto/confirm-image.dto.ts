import { IsString, IsNumber, Min, Max } from 'class-validator';

export class ConfirmImageDto {
  @IsString()
  key!: string;

  @IsNumber()
  @Min(0)
  @Max(4)
  order!: number;

  @IsNumber()
  @Min(1)
  width!: number;

  @IsNumber()
  @Min(1)
  height!: number;
}
