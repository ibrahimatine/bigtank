import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: "L'identifiant (email ou téléphone) est requis" })
  @IsString()
  emailOrPhone!: string;

  @IsString()
  @MinLength(8, { message: 'Mot de passe invalide' })
  password!: string;
}
