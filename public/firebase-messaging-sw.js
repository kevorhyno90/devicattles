// Firebase Messaging Service Worker
// Check if environment supports messaging before initializing
if ('serviceWorker' in self) {
  try {
    importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-messaging-compat.js');

    firebase.initializeApp({
      apiKey: "AIzaSyD9Ll4vI6CTBcMOfREMJ96Drev5OskopKU",
      authDomain: "devicattlesgit-35265529-12687.firebaseapp.com",
      projectId: "devicattlesgit-35265529-12687",
      storageBucket: "devicattlesgit-35265529-12687.firebasestorage.app",
      messagingSenderId: "454358426628",
      appId: "1:454358426628:web:a064f71cb25a1474618151",
      measurementId: "G-09H4N1HQN0"
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function(payload) {
      console.log('📬 [firebase-messaging-sw.js] Background message:', payload);
      const notificationTitle = payload.notification?.title || 'Farm Reminder';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.info('ℹ️ Firebase Messaging SW: Not supported in this environment');
  }
}
