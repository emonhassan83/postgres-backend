import { HttpStatusCode } from 'axios';

import {
  assertEmailNotTaken,
  assertPhoneNotTaken,
  findActiveUserOrThrow,
  sendUserStatusNotifYToUser,
} from './user.helpers';

import QueryBuilder from '@/app/builder/QueryBuilder';
import ApiError from '@/app/errors/ApiError';
import { generateTokens } from '@/app/modules/auth/auth.helpers';
import { IUserStatus } from '@/app/schemas/modules/user/user.constant';
import { IUser } from '@/app/schemas/modules/user/user.interface';
import prisma from '@/app/configs/prisma';

// ─── Read ──────────────────────────────────────────────────────────────────

const getAllUsersFromDB = async (_traceId: string, query: Record<string, unknown>) => {
  const usersQuery = new QueryBuilder(prisma.user, query);
  
  usersQuery.prismaQuery.where = {
    isDeleted: false,
    role: { not: 'admin' },
  };

  usersQuery
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  if (!usersQuery.prismaQuery.select) {
    usersQuery.prismaQuery.select = {
      id: true,
      name: true,
      email: true,
      profileAvatar: true,
      role: true,
      address: true,
      status: true,
      createdAt: true,
    };
  }

  const [users, meta] = await Promise.all([
    usersQuery.execute(),
    usersQuery.countTotal(),
  ]);

  return { meta, users };
};

const getSingleUser = async (traceId: string, userId: string): Promise<IUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user || user.isDeleted) {
    throw new ApiError(HttpStatusCode.NotFound, 'User not found', traceId);
  }
  return user;
};

// ─── Update ────────────────────────────────────────────────────────────────

const changeEmail = async (
  traceId: string,
  userId: string,
  payload: { email: string }
) => {
  const { email: newEmail } = payload;

  const user = await findActiveUserOrThrow(userId, traceId);

  if (!user.isChangeEmailOtpVerified) {
    throw new ApiError(HttpStatusCode.BadRequest, 'Please verify OTP first', traceId);
  }

  await assertEmailNotTaken(newEmail, userId, traceId);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      email: newEmail,
      isChangeEmailOtpVerified: false,
    },
  });

  return generateTokens(updatedUser);
};

const updateUserProfile = async (
  traceId: string,
  userId: string,
  payload: Partial<IUser> & { latitude?: number; longitude?: number }
): Promise<Partial<IUser>> => {
  await findActiveUserOrThrow(userId, traceId);

  const updateData: Record<string, any> = { ...payload };

  if (payload.latitude && payload.longitude) {
    updateData.latitude = payload.latitude;
    updateData.longitude = payload.longitude;
  }

  if (payload.phone) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (payload.phone !== user?.phone) {
      if (!user?.isChangePhoneOtpVerified) {
        throw new ApiError(
          HttpStatusCode.BadRequest,
          'Please verify your new phone with OTP first',
          traceId
        );
      }
      await assertPhoneNotTaken(payload.phone, userId, traceId);
      updateData.isChangePhoneOtpVerified = false;
    }
  }

  delete updateData.notifications;

  const result = await prisma.user.update({
    where: { id: userId },
    data: { ...updateData },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      profileAvatar: true,
      address: true,
      latitude: true,
      longitude: true,
      timeZone: true,
    }
  });

  if (!result) throw new ApiError(HttpStatusCode.NotFound, 'User not found', traceId);
  return result;
};

const updateUserStatus = async (
  traceId: string,
  userId: string,
  payload: { status: IUserStatus }
): Promise<IUser | null> => {
  await findActiveUserOrThrow(userId, traceId);

  const result = await prisma.user.update({
    where: { id: userId },
    data: { status: payload.status as any },
  });

  if (!result) throw new ApiError(HttpStatusCode.NotFound, 'User not found', traceId);

  await sendUserStatusNotifYToUser(payload.status, result);
  
  return result;
};

const updateLocationFromDB = async (
  traceId: string,
  userId: string,
  payload: { longitude: number; latitude: number; address: string }
) => {
  const { longitude, latitude, address } = payload;

  await findActiveUserOrThrow(userId, traceId);

  return prisma.user.update({
    where: { id: userId },
    data: { longitude, latitude, address },
  });
};

// ─── Delete ────────────────────────────────────────────────────────────────

const deleteUserProfile = async (traceId: string, userId: string): Promise<IUser | null> => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.isDeleted) {
      throw new ApiError(HttpStatusCode.NotFound, 'User not found', traceId);
    }

    const deletedUser = await tx.user.update({
      where: { id: userId },
      data: { isDeleted: true },
    });

    return deletedUser;
  });
};

export const UserService = {
  getAllUsersFromDB,
  getSingleUser,
  changeEmail,
  updateUserProfile,
  updateUserStatus,
  updateLocationFromDB,
  deleteUserProfile,
};
