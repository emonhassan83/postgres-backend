import { HttpStatusCode } from 'axios';
import bcrypt from 'bcrypt';

import prisma from '@/app/configs/prisma';
import ApiError from '@/app/errors/ApiError';
import { NOTIFICATION_MODEL_TYPE } from '@/app/schemas/modules/notification/notification.constant';
import { ISignUpWithEmail, IUser } from '@/app/schemas/modules/user/user.interface';
import { sendBothNotificationViaQueue } from '@/app/utils/notification-queue.service';

// ─── Lean lookups — no throw, callers decide ───────────────────────────────

export const findUserById = async (userId: string) =>
  prisma.user.findUnique({ where: { id: userId } });

export const findUserByEmail = async (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const findUserByPhone = async (phone: string) =>
  prisma.user.findFirst({ where: { phone } });

export const checkUserExists = async (email: string, phone?: string) =>
  prisma.user.findFirst({
    where: {
      OR: [
        { email },
        phone ? { phone } : {}
      ]
    }
  });

// ─── Mutations ─────────────────────────────────────────────────────────────

export const createUser = async (payload: ISignUpWithEmail) => {
  const hashedPassword = payload.password ? await bcrypt.hash(payload.password, 12) : '';
  return prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      countryCode: payload.countryCode || null,
      phone: payload.phone || null,
      password: hashedPassword,
      isLegalTermsAccepted: payload.isLegalTermsAccepted,
    }
  });
};

export const updateUser = async (userId: string, data: Record<string, any>) => {
  const updateData = { ...data };
  if (updateData.location) {
    updateData.longitude = updateData.location.coordinates[0];
    updateData.latitude = updateData.location.coordinates[1];
    delete updateData.location;
  }
  return prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
};

export const softDeleteUser = async (userId: string) =>
  prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true },
  });

export const restoreUser = async (
  userId: string,
  data: Record<string, any>,
  traceId?: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(HttpStatusCode.NotFound, 'User not found', traceId);
  
  const updateData = { ...data };
  if (updateData.location) {
    updateData.longitude = updateData.location.coordinates[0];
    updateData.latitude = updateData.location.coordinates[1];
    delete updateData.location;
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      isDeleted: false
    }
  });
};

export const updateUnverifiedUser = async (
  userId: string,
  data: Record<string, any>,
  traceId?: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(HttpStatusCode.NotFound, 'User not found', traceId);

  const updateData = { ...data };
  if (updateData.location) {
    updateData.longitude = updateData.location.coordinates[0];
    updateData.latitude = updateData.location.coordinates[1];
    delete updateData.location;
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
};

// ─── Validators — throw on violation ───────────────────────────────────────

export const validateUserExists = (user: any, traceId?: string): void => {
  if (!user || user.isDeleted) {
    throw new ApiError(HttpStatusCode.NotFound, 'User not found', traceId);
  }
};

export const validateUserCreation = (user: any, traceId?: string): void => {
  if (!user) {
    throw new ApiError(HttpStatusCode.BadRequest, 'User creation failed', traceId);
  }
};

// Throws if user not found or soft-deleted — used inside service functions
export const findActiveUserOrThrow = async (userId: string, traceId?: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isDeleted) {
    throw new ApiError(HttpStatusCode.NotFound, 'User not found', traceId);
  }
  return user;
};

export const assertEmailNotTaken = async (
  email: string,
  excludeUserId: string,
  traceId?: string
) => {
  const exists = await prisma.user.findFirst({
    where: {
      email,
      id: { not: excludeUserId }
    }
  });
  if (exists) {
    throw new ApiError(
      HttpStatusCode.Conflict,
      'This email is already in use by another account',
      traceId
    );
  }
};

export const assertPhoneNotTaken = async (
  phone: string,
  excludeUserId: string,
  traceId?: string
) => {
  const exists = await prisma.user.findFirst({
    where: {
      phone,
      id: { not: excludeUserId }
    }
  });
  if (exists) {
    throw new ApiError(
      HttpStatusCode.Conflict,
      'This phone number is already in use',
      traceId
    );
  }
};

// ─── Pure utils ────────────────────────────────────────────────────────────

export const buildGeoLocation = (longitude: number, latitude: number) => ({
  type: 'Point' as const,
  coordinates: [longitude, latitude] as [number, number],
});

// ─── Firebase Push Notification Helpers ──────────────────────────────────────

export const updateUserFcmToken = async (userId: string, fcmToken: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { fcmToken },
  });
};

export const getUserFcmToken = async (userId: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true }
  });
  return user?.fcmToken || null;
};

export const sendUserStatusNotifYToUser = async (
  status: 'active' | 'blocked' | 'pending',
  user: IUser
) => {
  if (!user || !user.id || !user.fcmToken) return;

  let message: string;
  let description: string;

  if (status === 'active') {
    message = '✅ Account Activated';
    description = 'Your account has been successfully activated. You can now access all available features.';
  } else if (status === 'blocked') {
    message = '🚫 Account Blocked';
    description = 'Your account has been blocked. Please contact support for further assistance.';
  } else {
    message = '⏳ Account Status Updated';
    description = 'Your account status has been updated.';
  }

  await sendBothNotificationViaQueue(
    user.id,
    user.fcmToken,
    message,
    description,
    {
      modelType: NOTIFICATION_MODEL_TYPE.User,
      reference: user.id,
    }
  );
};
