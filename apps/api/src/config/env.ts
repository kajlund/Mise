import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGO_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/mise'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
});
export type Env = z.infer<typeof schema>;
export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const env = schema.parse(source);
  if (
    env.NODE_ENV === 'production' &&
    /localhost|127\.0\.0\.1/.test(env.MONGO_URI)
  )
    throw new Error('Production cannot use a local MONGO_URI');
  return env;
}
