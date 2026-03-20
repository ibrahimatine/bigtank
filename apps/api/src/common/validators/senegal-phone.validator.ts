import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsSenegalPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: unknown) {
    if (typeof phone !== 'string') return false;
    if (!phone) return true; // vide = optionnel
    const cleaned = phone.replace(/[\s\-\.]/g, '');
    return /^(\+?221|00221)?[0-9]{9}$/.test(cleaned);
  }

  defaultMessage() {
    return 'Numero invalide (ex: 77 000 00 00 ou +221 77 000 00 00)';
  }
}

export function IsSenegalPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSenegalPhoneConstraint,
    });
  };
}
