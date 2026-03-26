import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage"; // ✅ เพิ่ม: สำหรับเก็บรูปภาพสินค้า/โปรไฟล์
import { getAnalytics } from "firebase/analytics"; // ✅ เพิ่ม: สำหรับดูสถิติคนเข้าชม

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

// 🛡️ ป้องกันการ Initialize ซ้ำ (Singleton Pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 🚨 ส่งออกบริการหลัก (Core Services)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // เรียกใช้ด้วย: import { storage } from './lib/firebase'
export const functions = getFunctions(app, 'asia-southeast1'); 

// 📈 เปิดใช้งาน Analytics (เฉพาะตอนรันบน Browser)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export const isFirebaseConfigured = true;

export default app;