import {
  ValidationPipe as NestValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

export const globalValidationOptions: ValidationPipeOptions = {
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
};

export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super(globalValidationOptions);
  }
}
