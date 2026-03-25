import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// 1. เพิ่มตัวแปรเช็คว่าใส่ API Key หรือยัง (เพื่อให้หน้า Home ไม่ Error)
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. ป้องกัน Error กรณี Analytics รันบน Server (SSR)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics };
export default app;
