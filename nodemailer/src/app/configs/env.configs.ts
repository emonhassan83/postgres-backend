import { TEnv } from '@/app/@types/system.types';
import { getBooleanEnv, getEnv, getNumberEnv } from '@/app/utils/env.utils';

export const env: TEnv = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getNumberEnv('PORT', '3000'),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', '*'),
  NODEMAILLER_SMTP_HOST: getEnv('NODEMAILLER_SMTP_HOST', 'smtp.gmail.com'),
  NODEMAILLER_SMTP_PORT: getNumberEnv('NODEMAILLER_SMTP_PORT', '587'),
  NODEMAILLER_SMTP_SECURE: getBooleanEnv('NODEMAILLER_SMTP_SECURE', 'false'),
  NODEMAILLER_HOST_MAIL: getEnv('NODEMAILLER_HOST_MAIL'),
  NODEMAILLER_HOST_PASS: getEnv('NODEMAILLER_HOST_PASS'),
  NODEMAILLER_FROM_MAIL: getEnv(
    'NODEMAILLER_FROM_MAIL',
    process.env.NODEMAILLER_HOST_MAIL
  ),
};
