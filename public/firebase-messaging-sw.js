// Scripts necessari per Firebase Messaging in background
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Inizializza l'app Firebase nel Service Worker
// IMPORTANTE: Inserisci qui le tue chiavi reali dalla Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
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
