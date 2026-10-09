import mongoose from 'mongoose';
import type { Logger } from 'pino';
export async function connectDatabase(
  uri: string,
  logger: Logger,
): Promise<void> {
  const connection = await mongoose.connect(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  });
  logger.info(
    { host: connection.connection.host, database: connection.connection.name },
    'MongoDB connected',
  );
}
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
