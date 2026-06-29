import { Job, Worker } from 'bullmq';

import logger from '@/app/configs/logger.configs';
import { getRedisClient } from '@/app/configs/redis.configs';
import { requestContext } from '@/app/configs/requestContext.configs';

export const createSystemWorker = (): Worker => {
  const SystemWorker = new Worker(
    'system-queue',
    async (job: Job) => {
      const { name } = job;
      const traceId = (job.data as any)?.traceId ?? 'NO_TRACE_ID';
      return requestContext.run({ traceId }, async () => {
        try {
          switch (name) {
            default:
              logger.warn(`Unknown job name: ${name}`);
              return;
          }
        } catch (error) {
          logger.error(
            `Error processing job ${name}: ${(error as Error).message}`
          );
          throw error;
        }
      });
    },
    {
      connection: getRedisClient() as any,
    }
  );

  SystemWorker.on('completed', (job: Job) => {
    const traceId = (job.data as any)?.traceId ?? 'NO_TRACE_ID';
    requestContext.run({ traceId }, () => {
      logger.info(`Job Name : ${job.name} Job Id : ${job.id} Completed`);
    });
  });

  SystemWorker.on('failed', (job: Job | undefined, error: Error) => {
    if (!job) {
      logger.error(
        `A job failed but the job data is undefined.\nError:\n${error}`
      );
      return;
    }
    const traceId = (job.data as any)?.traceId ?? 'NO_TRACE_ID';
    requestContext.run({ traceId }, () => {
      logger.error(
        `Job Name : ${job.name} Job Id : ${job.id} Failed\nError:\n${error}`
      );
    });
  });

  return SystemWorker;
};
