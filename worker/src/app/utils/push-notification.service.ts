import admin from 'firebase-admin';

import { env } from '@/app/configs/env.configs';

// Lazy singleton — initialised once on first push attempt
let _app: admin.app.App | null = null;

const getFirebaseApp = (): admin.app.App => {
  if (!_app) {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    _app = admin.initializeApp(
      { credential: admin.credential.cert(serviceAccount) },
      'worker-push-notifications'
    );
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

  const messageId = await getFirebaseApp()
    .messaging()
    .send({
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
      getFirebaseApp()
        .messaging()
        .send({
          token: fcmToken,
          notification: { title, body },
          data,
          android: { priority: 'high' },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        })
    )
  );

  return messageIds.map((messageId) => ({ success: true, messageId }));
};
