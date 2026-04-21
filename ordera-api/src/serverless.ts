import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import cookieParser from 'cookie-parser';

let cachedApp: any;

const bootstrap = async () => {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      rawBody: true,
    });

    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    
    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    });

    await app.init();
    cachedApp = expressApp;
  }
  return cachedApp;
};

export default async (req: any, res: any) => {
  const app = await bootstrap();
  return app(req, res);
};
