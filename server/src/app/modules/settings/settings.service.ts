import { HttpStatusCode } from 'axios';

import ApiError from '@/app/errors/ApiError';
import { deleteCache, deleteCachePattern, getCache, setCache } from '@/app/redis/helpers';
import { REDIS_KEYS } from '@/app/redis/keys';
import { GENERAL_KEYS } from '@/app/schemas/modules/settings/settings.constant';
import prisma from '@/app/configs/prisma';

// ─── Read ──────────────────────────────────────────────────────────────────

const getSetting = async (traceId: string, key: string) => {
  if (!key) throw new ApiError(HttpStatusCode.BadRequest, 'Key is required', traceId);

  const cacheKey = REDIS_KEYS.SETTINGS_SINGLE(key);
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  const setting = await prisma.setting.findUnique({
    where: { key }
  });
  if (!setting) {
    throw new ApiError(
      HttpStatusCode.NotFound,
      `Setting with key "${key}" not found`,
      traceId
    );
  }

  await setCache(cacheKey, setting);
  return setting;
};

const getSettingGenerals = async (_traceId: string) => {
  const cacheKey = REDIS_KEYS.SETTINGS_GENERALS;
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const settings = await prisma.setting.findMany({
    where: { key: { in: GENERAL_KEYS as any } }
  });

  await setCache(cacheKey, settings);
  return settings;
};

// ─── Write ─────────────────────────────────────────────────────────────────

const createOrUpdate = async (traceId: string, key: string, payload: any) => {
  if (!key || key === 'generals') {
    throw new ApiError(
      HttpStatusCode.BadRequest,
      'Key is required and cannot be "generals"',
      traceId
    );
  }

  const value = payload.value !== undefined ? payload.value : payload;

  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  // Invalidate single + generals + pattern in parallel
  await Promise.all([
    deleteCache(REDIS_KEYS.SETTINGS_SINGLE(key)),
    deleteCache(REDIS_KEYS.SETTINGS_GENERALS),
    deleteCachePattern('setting:*'),
  ]);

  return setting;
};

const updateGenerals = async (traceId: string, payload: Record<string, any>) => {
  const validKeys = GENERAL_KEYS.filter((key) => payload[key] !== undefined);

  if (validKeys.length === 0) {
    throw new ApiError(
      HttpStatusCode.BadRequest,
      'No valid general setting keys provided',
      traceId
    );
  }

  // Update all matching keys in parallel
  await Promise.all(
    validKeys.map((key) => {
      const value = payload[key];
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    })
  );

  // Invalidate all affected caches in parallel
  await Promise.all([
    deleteCache(REDIS_KEYS.SETTINGS_GENERALS),
    deleteCachePattern('setting:*'),
    ...validKeys.map((key) => deleteCache(REDIS_KEYS.SETTINGS_SINGLE(key))),
  ]);
};

export const SettingService = {
  getSetting,
  getSettingGenerals,
  createOrUpdate,
  updateGenerals,
};
