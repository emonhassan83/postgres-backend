export type TEnv = {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;
  NODEMAILLER_SMTP_HOST: string;
  NODEMAILLER_SMTP_PORT: number;
  NODEMAILLER_SMTP_SECURE: boolean;
  NODEMAILLER_HOST_MAIL: string;
  NODEMAILLER_HOST_PASS: string;
  NODEMAILLER_FROM_MAIL: string;
};

export type TSendMailBody = {
  to?: string;
  subject?: string;
  html?: string;
};

export type TMailOption = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  disableFileAccess: boolean;
  disableUrlAccess: boolean;
};

export type TShutdown = {
  reason: string;
  server: import('node:http').Server;
  error?: unknown;
};
