import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingCondition } from '@bigtank/shared-types';
import {
  SENEGAL_REGIONS,
  LISTING_TITLE_MAX_LENGTH,
  LISTING_DESCRIPTION_MAX_LENGTH,
} from '@bigtank/shared-utils';

export class CreateListingDto {
  @IsString()
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caracteres' })
  @MaxLength(LISTING_TITLE_MAX_LENGTH)
  title!: string;

  @IsString()
  @MinLength(10, { message: 'La description doit contenir au moins 10 caracteres' })
  @MaxLength(LISTING_DESCRIPTION_MAX_LENGTH)
  description!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  brand!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  model!: string;

  @IsNumber()
  @Min(20, { message: 'La taille minimum est 20' })
  @Max(55)
  sizeEu!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La taille US doit etre un nombre' })
  @Min(0, { message: 'La taille US ne peut pas etre negative' })
  @Max(20)
  sizeUs?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La taille UK doit etre un nombre' })
  @Min(0, { message: 'La taille UK ne peut pas etre negative' })
  @Max(18)
  sizeUk?: number;

  @IsEnum(ListingCondition, { message: 'Condition invalide' })
  condition!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  color!: string;

  @IsNumber()
  @Min(500, { message: 'Le prix minimum est de 500 FCFA' })
  @Max(500000, { message: 'Le prix maximum est de 500 000 FCFA' })
  priceXof!: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  locationCity?: string;

  @IsIn([...SENEGAL_REGIONS], { message: 'Region invalide' })
  locationRegion!: string;
}
