import prisma from '@/app/configs/prisma';
import logger from '@/app/configs/logger.configs';

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('[Postgres] Connected successfully via Prisma');
  } catch (error) {
    logger.error('[Postgres] Connection error', { error });
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('[Postgres] Disconnected successfully');
  } catch (error) {
    logger.error('[Postgres] Disconnection error', { error });
  }
};

export default prisma;
