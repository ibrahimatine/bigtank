import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class StartConversationDto {
  @IsString()
  @IsNotEmpty({ message: 'L\'identifiant de l\'annonce est requis' })
  listingId!: string;

  @IsString()
  @MinLength(1, { message: 'Le message ne peut pas etre vide' })
  @MaxLength(1000, { message: 'Le message ne peut pas depasser 1000 caracteres' })
  message!: string;
}
