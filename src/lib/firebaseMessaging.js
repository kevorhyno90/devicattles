import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: "BG4uQNeO-WWaHsPHvfFF1m4ojmz6u1HwbYniH4gkKGH1hHYhsPqe_YC-kvLTn6Q-qMbd9VAqvGy7x1hwKLP9roI" });
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
