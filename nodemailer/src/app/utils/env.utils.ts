import path from 'path';

import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../../.env') });

export const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing Environment Variable: ${key}`);
  }

  return value;
};

export const getNumberEnv = (key: string, fallback?: string): number => {
  const value = Number(getEnv(key, fallback));

  if (Number.isNaN(value)) {
    throw new Error(`Invalid Number Environment Variable: ${key}`);
  }

  return value;
};

export const getBooleanEnv = (key: string, fallback?: string): boolean => {
  return getEnv(key, fallback) === 'true';
};
