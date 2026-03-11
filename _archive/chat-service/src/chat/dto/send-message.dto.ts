import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'L\'identifiant de la conversation est requis' })
  conversationId!: string;

  @IsString()
  @MinLength(1, { message: 'Le message ne peut pas etre vide' })
  @MaxLength(1000, { message: 'Le message ne peut pas depasser 1000 caracteres' })
  content!: string;
}
