import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingCondition } from '@bigtank/shared-types';
import { SENEGAL_REGIONS } from '@bigtank/shared-utils';

export class ListingFiltersDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  sizeEuMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(55)
  sizeEuMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsIn([...SENEGAL_REGIONS])
  region?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc', 'date', 'popularity'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
