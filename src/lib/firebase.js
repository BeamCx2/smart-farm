import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// 1. เพิ่มการ Import Auth และ Firestore
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. สร้างตัวแปรและ Export ออกไปใช้ในไฟล์อื่น
export const auth = getAuth(app);
export const db = getFirestore(app);

// หากต้องการส่งออก app เป็น default (เผื่อไว้)
export default app;
