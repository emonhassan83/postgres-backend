import { HttpStatusCode } from 'axios';

import { emitSocketNotification } from './notification.helpers';

import QueryBuilder from '@/app/builder/QueryBuilder';
import ApiError from '@/app/errors/ApiError';
import { decrementUnreadCount, setUnreadCountInRedis } from '@/app/redis/helpers/notification';
import { INotification } from '@/app/schemas/modules/notification/notification.interface';
import prisma from '@/app/configs/prisma';

// ─── Create ────────────────────────────────────────────────────────────────

const createNotificationIntoDB = async (traceId: string, payload: INotification) => {
  const receiverId = typeof payload.receiver === 'string' ? payload.receiver : (payload.receiver as any)?.id;
  const referenceId = typeof payload.reference === 'string' ? payload.reference : (payload.reference as any)?.id || null;

  const notification = await prisma.notification.create({
    data: {
      receiverId,
      referenceId,
      modelType: payload.modelType as any,
      message: payload.message || '',
      description: payload.description || '',
      date: payload.date || new Date(),
      read: payload.read || false,
    }
  });

  if (!notification) {
    throw new ApiError(HttpStatusCode.Conflict, 'Notification not created!', traceId);
  }

  emitSocketNotification(traceId, payload);
  return notification;
};

const sendGeneralNotificationIntoDB = async (traceId: string, payload: INotification) => {
  const { message, description, reference, modelType } = payload;
  const referenceId = typeof reference === 'string' ? reference : (reference as any)?.id || null;

  const users = await prisma.user.findMany({
    where: { role: 'user' },
    select: { id: true }
  });

  const userIds = users.map((u) => u.id);

  if (userIds.length === 0) return;

  const notifications = userIds.map((userId) => ({
    receiverId: userId,
    referenceId,
    modelType: modelType as any,
    message: message || '',
    description: description || '',
  }));

  const result = await prisma.notification.createMany({
    data: notifications
  });

  if (!result || result.count === 0) {
    throw new ApiError(HttpStatusCode.Conflict, 'Notifications not created!', traceId);
  }

  userIds.forEach((userId) =>
    emitSocketNotification(traceId, { ...payload, receiver: userId })
  );
};

// ─── Read ──────────────────────────────────────────────────────────────────

const getAllNotificationFromDB = async (
  _traceId: string,
  query: Record<string, unknown>
) => {
  const notificationQuery = new QueryBuilder(prisma.notification, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    notificationQuery.execute(),
    notificationQuery.countTotal(),
  ]);

  return { meta, result };
};

// ─── Update ────────────────────────────────────────────────────────────────

const markAsDoneFromDB = async (_traceId: string, userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { receiverId: userId },
    data: { read: true }
  });

  if (result.count > 0) {
    await setUnreadCountInRedis(userId, 0);
  }

  return result;
};

// ─── Delete ────────────────────────────────────────────────────────────────

const deleteANotificationFromDB = async (traceId: string, id: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id }
  });
  if (!notification) {
    throw new ApiError(HttpStatusCode.NotFound, 'Notification not found!', traceId);
  }

  const wasUnread = !notification.read;
  const deleted = await prisma.notification.delete({
    where: { id }
  });

  if (wasUnread && deleted) {
    await decrementUnreadCount(notification.receiverId);
  }

  return deleted;
};

const deleteAllNotificationsFromDB = async (traceId: string, userId: string) => {
  const unreadCount = await prisma.notification.count({
    where: { receiverId: userId, read: false }
  });

  const result = await prisma.notification.deleteMany({
    where: { receiverId: userId }
  });

  if (result.count === 0) {
    throw new ApiError(HttpStatusCode.NotFound, 'No notifications found!', traceId);
  }

  if (unreadCount > 0) {
    await decrementUnreadCount(userId, unreadCount);
  }

  return result;
};

export const NotificationService = {
  createNotificationIntoDB,
  sendGeneralNotificationIntoDB,
  getAllNotificationFromDB,
  markAsDoneFromDB,
  deleteANotificationFromDB,
  deleteAllNotificationsFromDB,
};
