import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Le token de rafraîchissement est requis' })
  @IsString()
  refreshToken!: string;
}
