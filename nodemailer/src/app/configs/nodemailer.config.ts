import { type TransportOptions, createTransport } from 'nodemailer';

import { env } from '@/app/configs/env.configs';

const mailTransporter = createTransport({
  host: env.NODEMAILLER_SMTP_HOST,
  port: env.NODEMAILLER_SMTP_PORT,
  secure: env.NODEMAILLER_SMTP_SECURE,
  disableFileAccess: true,
  disableUrlAccess: true,
  auth: {
    user: env.NODEMAILLER_HOST_MAIL,
    pass: env.NODEMAILLER_HOST_PASS,
  },
} as TransportOptions);

export default mailTransporter;
