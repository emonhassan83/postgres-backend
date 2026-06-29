import mongoose from 'mongoose';

import logger from '@/app/configs/logger.configs';
import { env } from '@/app/configs/env.configs';

mongoose.connection.on('error', (error) => {
  logger.error('[MongoDB] Connection error', { error });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('[MongoDB] Disconnected');
});

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
  console.log('[MongoDB] Connected');
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;

  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected');
};

export default mongoose;
