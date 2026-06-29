import cors from 'cors';
import express, { type Request, type Response } from 'express';

import { TSendMailBody } from '@/app/@types/system.types';
import { env } from '@/app/configs/env.configs';
import mailTransporter from '@/app/configs/nodemailer.config';
import { mailOption } from '@/app/utils/mail.utils';
import { isValidEmailPayload } from '@/app/utils/system.utils';

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  })
);
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Monorepo nodemailer is running!');
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, service: 'nodemailer' });
});

app.post(
  '/',
  async (req: Request<object, object, TSendMailBody>, res: Response) => {
    if (!isValidEmailPayload(req.body)) {
      res.status(400).json({
        success: false,
        message: 'to, subject, and html are required.',
      });
      return;
    }

    const { to, subject, html } = req.body;

    try {
      await mailTransporter.sendMail(mailOption(to, subject, html));

      res.status(200).json({
        success: true,
        message: 'Email sent successfully.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      console.error('Error sending email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email.',
        error: message,
      });
    }
  }
);

export default app;
