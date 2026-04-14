// Scripts necessari per Firebase Messaging in background
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Inizializza l'app Firebase nel Service Worker
// IMPORTANTE: Inserisci qui le tue chiavi reali dalla Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCv39E1Yf3yUTsukTYIr9ZzJN6im-L2e4k",
    authDomain: "jobs-report-push.firebaseapp.com",
    projectId: "jobs-report-push",
    storageBucket: "jobs-report-push.firebasestorage.app",
    messagingSenderId: "1044002168011",
    appId: "1:1044002168011:web:92bb217ab84f7786d70f4e"
};

if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Gestione dei messaggi in background
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Ricevuto messaggio in background: ', payload);
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: payload.notification.icon || '/icon-192x192.png',
            data: payload.data
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

// Gestione click sulla notifica
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // URL di destinazione (usiamo quello dai dati o fallback)
  const targetUrl = event.notification.data?.url || '/communications';

  // Logica "Focus or Open"
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se c'è già una finestra aperta, mettila in focus
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Altrimenti apri una nuova finestra
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
