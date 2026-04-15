import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // STEP 5 — prefix 'api'
  app.setGlobalPrefix('api');
  
  // Global ValidationPipe config
  app.useGlobalPipes(new ValidationPipe());
  
  app.use(cookieParser());
  
  // CORS: allow FRONTEND_URL (Step 7) or fallback to dev local
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`[Ordera API v3] Server running on: http://localhost:${port}/api`);
}

bootstrap();
