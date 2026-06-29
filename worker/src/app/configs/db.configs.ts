import { PrismaClient } from '@prisma/client';

import logger from '@/app/configs/logger.configs';

export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('[PostgreSQL] Connected via Prisma Client');
  } catch (error) {
    logger.error('[PostgreSQL] Connection error', { error });
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('[PostgreSQL] Disconnected');
};

export default prisma;
