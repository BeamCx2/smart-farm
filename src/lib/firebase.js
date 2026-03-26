import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBaYn459JOBoCX3PGfEUUW9pzuCxXiFCuA",
  authDomain: "smart-farm-c69be.firebaseapp.com",
  databaseURL: "https://smart-farm-c69be-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-farm-c69be",
  storageBucket: "smart-farm-c69be.firebasestorage.app",
  messagingSenderId: "139389413918",
  appId: "1:139389413918:web:46fd439d179bebd051dc0f",
  measurementId: "G-80E67N6X08"
};

// 1. สร้าง App ก่อน (Singleton Pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. ส่งออกบริการต่างๆ โดยใช้ app ที่สร้างเสร็จแล้ว
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-southeast1'); // ✅ ระบุโซนให้ตรงกับที่ Deploy

// 3. Analytics (เฉพาะบน Browser)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export const isFirebaseConfigured = true;

export default app;
