import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // STEP 5 — prefix 'api'
  app.setGlobalPrefix('api');
  
  // Global ValidationPipe config
  app.useGlobalPipes(new ValidationPipe());
  
  app.use(cookieParser());
  
  // CORS: allow FRONTEND_URL or allow all for production
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  
  // Only listen if we are NOT on Vercel
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    await app.listen(port);
    console.log(`[Ordera API v3] Server running on: http://localhost:${port}/api`);
  }
  
  return app.getHttpAdapter().getInstance();
}

// For local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  bootstrap();
}

// Export for Vercel
export default bootstrap;
