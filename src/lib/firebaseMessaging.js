import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase";

const messaging = getMessaging(app);

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: "YOUR_PUBLIC_VAPID_KEY" });
      console.log("FCM Token:", token);
      return token;
    } else {
      throw new Error("Notification permission denied");
    }
  } catch (err) {
    console.error("FCM setup error:", err);
    return null;
  }
}

export function listenForMessages(callback) {
  onMessage(messaging, (payload) => {
    console.log("FCM Message received:", payload);
    if (callback) callback(payload);
  });
}
