import { IsEnum } from 'class-validator';
import { ListingStatus } from '@samadal/shared-types';

export class UpdateStatusDto {
  @IsEnum(ListingStatus, { message: 'Statut invalide' })
  status!: string;
}
