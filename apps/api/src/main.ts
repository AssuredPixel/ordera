import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Native local .env parser (bypassing package installations)
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const splitIdx = trimmed.indexOf('=');
        const key = trimmed.slice(0, splitIdx).trim();
        const val = trimmed.slice(splitIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    });
  } catch (e: any) { 
    // Ignore error but allow app to start
  }

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  });
  await app.listen(process.env.PORT || 5001);
}
bootstrap().catch(err => {
  console.error('CRITICAL BOOTSTRAP ERROR:', err);
  process.exit(1);
});
