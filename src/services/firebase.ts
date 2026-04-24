import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

// Sostituire queste con le tue chiavi reali o usare import.meta.env
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let messaging: any = null;

try {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
    } else {
        console.warn('Firebase API Key is missing. Push notifications will be disabled.');
    }
} catch (error) {
    console.error('Failed to initialize Firebase:', error);
}

export { messaging };

export const requestForToken = async (registration?: ServiceWorkerRegistration) => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    return currentToken;
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};
