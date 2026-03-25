import { initializeApp } from "firebase/app";
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

const app = initializeApp(firebaseConfig);

// 🚨 เหลือไว้แค่อันเดียวแบบนี้ครับ
export const isFirebaseConfigured = true; 

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
