import { createServer, type Server } from 'node:http';

import app from '@/app';
import { env } from '@/app/configs/env.configs';
import { shutdown } from '@/app/utils/shutdown.utils';

const server: Server = createServer(app);

async function main(): Promise<void> {
  server.listen(env.PORT, '0.0.0.0', () => {
    console.log('Nodemailer service ready!');
    console.log(`Local:   http://localhost:${env.PORT}`);
    console.log(`Network: http://0.0.0.0:${env.PORT}`);
  });
}

main().catch((error) => shutdown({ reason: 'startupFailure', server, error }));

process.on('SIGINT', () => shutdown({ reason: 'SIGINT', server }));
process.on('SIGTERM', () => shutdown({ reason: 'SIGTERM', server }));

process.on('unhandledRejection', (error) =>
  shutdown({ reason: 'unhandledRejection', server, error })
);

process.on('uncaughtException', (error) =>
  shutdown({ reason: 'uncaughtException', server, error })
);
