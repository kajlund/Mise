import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { serve } from '@hono/node-server';
import pino from 'pino';
import { createApp } from './app.js';
import { readEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './db/client.js';
import { RecipeService } from './services/recipe-service.js';

loadDotenv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
const env = readEnv();
const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});
try {
  await connectDatabase(env.MONGO_URI, logger);
} catch (error) {
  logger.fatal(
    { err: error },
    'Could not connect to MongoDB. Check MONGO_URI, credentials, and network access.',
  );
  process.exit(1);
}
const server = serve(
  {
    fetch: createApp(new RecipeService(), logger, env.WEB_ORIGIN).fetch,
    port: env.PORT,
  },
  () =>
    logger.info(
      { port: env.PORT, environment: env.NODE_ENV },
      'Mise API listening',
    ),
);
async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
