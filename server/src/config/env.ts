import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_WEB_API_KEY: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);

if (parsedEnv.NODE_ENV !== 'test' && !parsedEnv.FIREBASE_WEB_API_KEY) {
  throw new Error('FIREBASE_WEB_API_KEY is required outside the test environment.');
}

export const env = {
  ...parsedEnv,
  FIREBASE_WEB_API_KEY: parsedEnv.FIREBASE_WEB_API_KEY ?? 'test-api-key',
};

export const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
