import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Security Headers
  app.use(helmet());

  // STEP 5 — prefix 'api'
  app.setGlobalPrefix('api');
  
  // Global ValidationPipe config
  app.useGlobalPipes(new ValidationPipe());
  
  app.use(cookieParser());
  
  // Tighten CORS
  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || (frontendUrl && origin === frontendUrl)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
