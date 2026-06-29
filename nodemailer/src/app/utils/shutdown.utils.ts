import { TShutdown } from '@/app/@types/system.types';
import mailTransporter from '@/app/configs/nodemailer.config';

let isShuttingDown = false;

const closeServer = async (server: TShutdown['server']): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      console.log('HTTP server closed');
      resolve();
    });
  });
};

export const shutdown = async ({
  reason,
  server,
  error,
}: TShutdown): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.warn(`Shutdown started: ${reason}`);

  if (error) {
    console.error(error);
  }

  const forceExitTimer = setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30_000);

  try {
    await closeServer(server);
    mailTransporter.close();
    console.log('Mail transporter closed');
  } catch (err) {
    console.error('Error during shutdown', err);
  } finally {
    clearTimeout(forceExitTimer);

    const exitCode = reason === 'SIGINT' || reason === 'SIGTERM' ? 0 : 1;
    process.exit(exitCode);
  }
};
