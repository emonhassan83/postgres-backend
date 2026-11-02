import { type App, initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import { env } from '@/app/configs/env.configs';

// Lazy singleton — initialised once on first push attempt
let _app: App | null = null;

const getFirebaseApp = (): App => {
  if (!_app) {
    const existing = getApps().find((a) => a.name === 'worker-push-notifications');
    if (existing) {
      _app = existing;
    } else {
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
      _app = initializeApp(
        { credential: cert(serviceAccount) },
        'worker-push-notifications'
      );
    }
  }
  return _app;
};

export interface TPushPayload {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>; // FCM data must be string → string
}

export interface TPushResult {
  success: boolean;
  messageId?: string;
}

export const sendPushNotification = async (
  payload: TPushPayload
): Promise<TPushResult> => {
  const { fcmToken, title, body, data } = payload;

  const messageId = await getMessaging(getFirebaseApp()).send({
    token: fcmToken,
    notification: { title, body },
    data,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  });

  return { success: true, messageId };
};

export const sendBatchPushNotification = async (
  notifications: TPushPayload[]
): Promise<TPushResult[]> => {
  const messageIds = await Promise.all(
    notifications.map(({ fcmToken, title, body, data }) =>
      getMessaging(getFirebaseApp()).send({
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      })
    )
  );

  return messageIds.map((messageId: string) => ({ success: true, messageId }));
};
