import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { IsSenegalPhone } from '../../common/validators/senegal-phone.validator';
import { SENEGAL_REGIONS } from '@bigtank/shared-utils';

export class RegisterDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: "Le téléphone ou l'email est requis" })
  @IsSenegalPhone()
  phone?: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsIn(SENEGAL_REGIONS, { message: 'Région invalide' })
  region?: string;
}
