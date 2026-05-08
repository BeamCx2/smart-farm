import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; // สำหรับ Realtime Database ที่ใช้ใน Smart Farm
import { getFirestore } from "firebase/firestore"; // ถ้าใช้ Firestore ด้วย

const firebaseConfig = {
  // แนะนำ: เปลี่ยนค่าเหล่านี้ไปใส่ใน .env และเรียกใช้ผ่าน import.meta.env
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export ตัวแปรไปใช้ในหน้าอื่น (เช่น หน้าควบคุมปั๊มน้ำ หรือหน้าดูเซนเซอร์)
export const db = getDatabase(app);
export const firestore = getFirestore(app);
export default app;
