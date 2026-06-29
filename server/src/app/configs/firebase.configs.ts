import admin from 'firebase-admin';
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

import { getFirebaseCredentials } from '@/app/utils/system.utils';

admin.initializeApp({
  credential: admin.credential.cert(
    getFirebaseCredentials() as admin.ServiceAccount
  ),
});

// Check if a Firebase instance has already been initialized globally
const apps = getApps();
let firebaseApp;

if (!apps.length) {
  // Initialize a fresh Firebase Admin application instance
  firebaseApp = initializeApp({
    credential: cert(getFirebaseCredentials() as admin.ServiceAccount),
  });
} else {
  // Reuse the existing active application instance
  firebaseApp = apps[0];
}

// Instantiate the Firebase Cloud Messaging instance for push notifications
export const messaging = getMessaging(firebaseApp);

export default firebaseApp;
