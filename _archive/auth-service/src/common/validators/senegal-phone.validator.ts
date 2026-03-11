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
    return /^\+221[0-9]{9}$/.test(phone);
  }

  defaultMessage() {
    return 'Le numéro de téléphone doit être au format sénégalais (+221XXXXXXXXX)';
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
