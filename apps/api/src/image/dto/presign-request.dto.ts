import { IsString, IsIn, MaxLength } from 'class-validator';

export class PresignRequestDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsIn(['image/jpeg', 'image/png', 'image/webp'], {
    message: 'Type non supporte. Utilisez JPEG, PNG ou WebP.',
  })
  contentType!: string;
}
