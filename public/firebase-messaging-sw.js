// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC3ZH_roI3O4e8O0TEcLbgJCuVI64t8b4c",
  authDomain: "devinsfarm-2025.firebaseapp.com",
  projectId: "devinsfarm-2025",
  storageBucket: "devinsfarm-2025.firebasestorage.app",
  messagingSenderId: "603947883430",
  appId: "1:603947883430:web:ac52cd8333bc7603c14d67",
  measurementId: "G-T8H86QB318"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Farm Reminder';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/public/assets/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
