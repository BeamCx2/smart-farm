import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // สำหรับ Cloud Firestore
import { getDatabase } from "firebase/database";   // สำหรับ Realtime Database
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 🚨 แยกท่อส่งข้อมูลให้ชัดเจน
export const db = getDatabase(app);        // ✅ ใช้กับ Smart Farm / สินค้า (ไอคอนฟ้า)
export const firestore = getFirestore(app); // ✅ ใช้กับ User Profile / ข้อมูลอื่นๆ (ไอคอนส้ม)

export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-southeast1');
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const isFirebaseConfigured = true;

export default app;