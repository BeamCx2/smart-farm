import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QRCodeCanvas } from 'qrcode.react';
import { formatTHB } from '../lib/utils';
import app from '../lib/firebase'; 

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  // ดึงข้อมูลจากหน้าที่แล้ว
  const { amount, orderId, firebaseId } = location.state || { amount: 0, orderId: 'N/A', firebaseId: '' };

  const [qrRawData, setQrRawData] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const functions = getFunctions(app, 'asia-southeast1'); 
  const getSCBQR = httpsCallable(functions, 'getscbqr');
  const storage = getStorage(app);

  // 1. ระบบเจน QR Code อัตโนมัติเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    const handleGenerateQR = async () => {
      if (amount <= 0) return;
      setLoading(true);
      try {
        const result = await getSCBQR({ amount, orderId });
        if (result.data && result.data.qrRawData) setQrRawData(result.data.qrRawData);
      } catch (error) { 
        console.error("QR Error:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    handleGenerateQR();
  }, [amount, orderId]);

  // 🚀 2. ฟังก์ชันตรวจสอบสลิปอัตโนมัติ (EasySlip) + อัปเดต Firebase
  const handleUploadSlip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    // แปลงไฟล์เป็น Base64 เพื่อส่งไปตรวจ
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result.split(',')[1];

      try {
        // --- ส่วนที่ 1: ส่งไปเช็คที่ Netlify Function ---
        const verifyRes = await fetch('/.netlify/functions/verify-slip', {
          method: 'POST',
          body: JSON.stringify({ imageBase64: base64Image })
        });
        
        const result = await verifyRes.json();

        if (result.status === 200) {
          const slipData = result.data;
          
          // 🚨 เช็คยอดเงิน และ ชื่อบัญชีผู้รับ (บอสต้องเปลี่ยนชื่อบัญชีในเครื่องหมายคำพูดนะครับ)
          const isAmountCorrect = Math.abs(slipData.amount.amount - amount) < 0.01; // ป้องกันทศนิยมคลาดเคลื่อน
          const isReceiverCorrect = slipData.receiver.displayName.includes("ชื่อบัญชีฟาร์มของบอส");

          if (isAmountCorrect && isReceiverCorrect) {
            // --- ส่วนที่ 2: ถ้าสลิปถูกต้อง -> อัปโหลดรูปเก็บไว้ใน Storage ---
            const storageRef = ref(storage, `slips/${orderId}_${Date.now()}.jpg`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // --- ส่วนที่ 3: อัปเดตสถานะใน Firestore เป็น 'paid' ---
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('orderId', '==', orderId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const orderDoc = querySnapshot.docs[0].ref;
              await updateDoc(orderDoc, {
                status: 'paid',         // เปลี่ยนเป็นจ่ายแล้วทันที
                slipUrl: downloadURL,
                verifiedBy: 'EasySlip Auto',
                updatedAt: new Date(),
                transRef: slipData.transRef // เก็บเลขที่อ้างอิงกันสลิปซ้ำ
              });

              alert("✅ ชำระเงินสำเร็จ! ระบบตรวจสอบสลิปเรียบร้อยครับ");
              navigate('/orders'); 
            }
          } else {
            alert("❌ ยอดเงินไม่ตรง หรือโอนผิดบัญชีครับ (ยอดที่ต้องโอน: " + amount + " บาท)");
          }
        } else {
          alert("❌ สลิปไม่ถูกต้อง หรืออาจจะเคยใช้ไปแล้วครับ");
        }
      } catch (error) {
        console.error("Verification Error:", error);
        alert("⚠️ ระบบตรวจสอบขัดข้อง กรุณาติดต่อแอดมินครับ");
      } finally {
        setUploading(false);
      }
    };
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full">
        <h1 className="text-xl font-black mb-1 text-gray-800 tracking-tighter">ชำระเงินค่าสินค้า</h1>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-8">Smart Farm Gateway</p>

        <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 mb-6 bg-gray-50/30">
          <div className="mb-6">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">ยอดชำระทั้งสิ้น</p>
            <p className="text-4xl font-black text-gray-900">{formatTHB(amount)}</p>
          </div>

          <div className="flex justify-center bg-white p-6 rounded-[2rem] shadow-xl shadow-emerald-500/5 border border-gray-50 mb-6">
            {loading ? (
              <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full"></div>
            ) : qrRawData ? (
              <QRCodeCanvas value={qrRawData} size={200} />
            ) : (
              <p className="text-xs text-gray-400">กำลังสร้าง QR Code...</p>
            )}
          </div>

          <div className="mt-4">
            <label className={`block w-full py-3 px-4 rounded-2xl text-[10px] font-black uppercase cursor-pointer transition-all
              ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}>
              {uploading ? '⚙️ กำลังตรวจสอบสลิป...' : '📸 ยืนยันการโอน (แนบสลิป)'}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleUploadSlip} 
                disabled={uploading || loading} 
              />
            </label>
          </div>
        </div>

        <p className="text-[10px] font-bold text-gray-400 px-10 leading-relaxed uppercase tracking-widest">
          สแกนแล้วอย่าลืมกดปุ่มสีเขียว <br/> เพื่อแนบหลักฐานการโอนนะครับ
        </p>
      </div>
    </div>
  );
}
