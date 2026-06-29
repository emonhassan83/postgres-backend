import { Job, Worker } from 'bullmq';

import logger from '@/app/configs/logger.configs';
import { getRedisClient } from '@/app/configs/redis.configs';
import { requestContext } from '@/app/configs/requestContext.configs';
import { Notification } from '@/app/schemas/modules/notification/notification.schema';
import { sendPushNotification, sendBatchPushNotification } from '@/app/utils/push-notification.service';

// ─── Job payload shape (must match what server enqueues) ───────────────────

type TChannel = 'socket' | 'push' | 'both';

interface INotificationJobData {
  traceId: string;
  channel: TChannel;
  userId: string;
  userIds?: string[];
  title: string;
  message: string;
  fcmToken?: string;
  fcmTokens?: string[];
  data?: Record<string, any>;
}

// ─── Delivery helpers ──────────────────────────────────────────────────────

const saveToDatabase = async (
  jobData: INotificationJobData
): Promise<void> => {
  const { userId, title, message, data } = jobData;

  await Notification.create({
    receiver: userId,
    message: title,
    description: message,
    modelType: data?.modelType ?? 'User',
    reference: data?.reference ?? null,
    read: false,
  });
};

const deliverViaPush = async (
  jobData: INotificationJobData
): Promise<void> => {
  const { traceId, userId, fcmToken, title, message, data } = jobData;

  if (!fcmToken) {
    logger.warn(`[${traceId}] No FCM token for user ${userId} — skipping push`);
    return;
  }

  // FCM data payload must be Record<string, string>
  const stringData: Record<string, string> = data
    ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
    : {};

  await sendPushNotification({ fcmToken, title, body: message, data: stringData });
};

// Email and SMS delivery removed - only socket, push, and both channels are supported

// ─── Worker factory ────────────────────────────────────────────────────────

export const createNotificationWorker = (): Worker => {
  const NotificationWorker = new Worker(
    'notification-queue',
    async (job: Job) => {
      const { id, name, data } = job;
      const traceId = (data as INotificationJobData)?.traceId ?? 'NO_TRACE_ID';

      return requestContext.run({ traceId }, async () => {
        try {
          const jobData = data as INotificationJobData;
          const { channel } = jobData;

          switch (name) {
            case 'send-notification': {
              // Deliver based on channel first
              let deliverySuccess = false;

              switch (channel) {
                case 'push':
                  await deliverViaPush(jobData);
                  deliverySuccess = true;
                  break;
                case 'both':
                  await deliverViaPush(jobData);
                  deliverySuccess = true;
                  break;
                case 'socket':
                  // Socket delivery is handled by the server in real-time
                  // Mark as success since server handles it
                  deliverySuccess = true;
                  break;
              }

              // Save to DB only if delivery was successful
              if (deliverySuccess) {
                await saveToDatabase(jobData);
              }

              return;
            }

            case 'send-batch-notification': {
              // Send notifications to multiple users
              const { fcmTokens, userIds } = jobData;
              
              // Save notification record for each user
              if (userIds && userIds.length > 0) {
                const savePromises = userIds.map((userId) => 
                  Notification.create({
                    receiver: userId,
                    message: jobData.title,
                    description: jobData.message,
                    modelType: jobData.data?.modelType ?? 'User',
                    reference: jobData.data?.reference ?? null,
                    read: false,
                  })
                );
                await Promise.all(savePromises);
              }

              // Send push notifications
              if (fcmTokens && fcmTokens.length > 0) {
                const notifications = fcmTokens.map((token: string) => ({
                  fcmToken: token,
                  title: jobData.title,
                  body: jobData.message,
                  data: jobData.data,
                }));
                await sendBatchPushNotification(notifications);
              }

              return;
            }

            default:
              throw new Error(`Unhandled notification job: ${name}`);
          }
        } catch (error) {
          logger.error('Notification worker job failed', {
            jobName: name,
            jobId: id,
            error,
          });
          throw error;
        }
      });
    },
    { connection: getRedisClient() as any, concurrency: 15 }
  );

  NotificationWorker.on('completed', (job: Job) => {
    const traceId = (job.data as any)?.traceId ?? 'NO_TRACE_ID';
    requestContext.run({ traceId }, () => {
      logger.info(`Job Name : ${job.name} Job Id : ${job.id} Completed`);
    });
  });

  NotificationWorker.on('failed', (job: Job | undefined, error: Error) => {
    if (!job) {
      logger.error(`A notification job failed but the job data is undefined.\nError:\n${error}`);
      return;
    }
    const traceId = (job.data as any)?.traceId ?? 'NO_TRACE_ID';
    requestContext.run({ traceId }, () => {
      logger.error(
        `Job Name : ${job.name} Job Id : ${job.id} Failed\nError:\n${error}`
      );
    });
  });

  return NotificationWorker;
};
