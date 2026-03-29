import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Native local .env parser (bypassing package installations)
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env'),
  ];
  
  let envLoadedFrom = '';
  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const splitIdx = trimmed.indexOf('=');
            const key = trimmed.slice(0, splitIdx).trim();
            const val = trimmed.slice(splitIdx + 1).trim();
            if (!process.env[key]) process.env[key] = val;
          }
        });
        console.log(`[Bootstrap] Loaded environment from: ${envPath}`);
        envLoadedFrom = envPath;
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  if (!envLoadedFrom) {
    console.warn('[Bootstrap] No .env file found in search paths. Using process defaults.');
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
