import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // ✅ เพิ่ม Storage
import { doc, updateDoc } from 'firebase/firestore'; // ✅ เพิ่ม Firestore
import { db } from '../lib/firebase'; // ✅ ต้อง Import db มาด้วยนะครับ
import { QRCodeCanvas } from 'qrcode.react';
import { formatTHB } from '../lib/utils';
import app from '../lib/firebase'; 

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, orderId, firebaseId } = location.state || { amount: 0, orderId: 'N/A', firebaseId: '' };

  const [qrRawData, setQrRawData] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slipImage, setSlipImage] = useState(null);

  const functions = getFunctions(app, 'asia-southeast1'); 
  const getSCBQR = httpsCallable(functions, 'getscbqr');
  const storage = getStorage(app);

  useEffect(() => {
    const handleGenerateQR = async () => {
      if (amount <= 0) return;
      setLoading(true);
      try {
        const result = await getSCBQR({ amount, orderId });
        if (result.data && result.data.qrRawData) setQrRawData(result.data.qrRawData);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    handleGenerateQR();
  }, [amount, orderId]);

  // 🚀 ฟังก์ชันอัปโหลดสลิปและอัปเดตสถานะ
  // 🚀 แก้ฟังก์ชันอัปโหลดสลิปใน Payment.jsx (จุดที่ Error)
const handleUploadSlip = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);
  try {
    // 1. อัปโหลดไป Storage (อันนี้ผ่านแล้ว)
    const storageRef = ref(storage, `slips/${orderId}_${Date.now()}.jpg`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // 2. ค้นหาเอกสารในคอลเลกชัน 'orders' ที่มีฟิลด์ orderId ตรงกับที่เรามี
    const { collection, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore');
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderId', '==', orderId)); // หาออเดอร์ที่ orderId ตรงกัน
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // ถ้าเจอ ให้หยิบเอกสารตัวแรกมาอัปเดต
      const orderDoc = querySnapshot.docs[0].ref;
      await updateDoc(orderDoc, {
        status: 'waiting_verify',
        slipUrl: downloadURL,
        updatedAt: new Date()
      });
      alert("อัปโหลดสลิปสำเร็จ! รอแอดมินตรวจสอบครับ");
      navigate('/orders');
    } else {
      alert("หาออเดอร์ไม่เจอในระบบครับบอส!");
      console.error("Order ID not found in Firestore:", orderId);
    }

  } catch (error) {
    console.error("Upload Error:", error);
    alert("อัปโหลดพลาดครับบอส!");
  } finally {
    setUploading(false);
  }
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
            {loading ? <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full"></div> : 
             qrRawData ? <QRCodeCanvas value={qrRawData} size={200} /> : <p>QR Error</p>}
          </div>

          {/* 📸 ส่วนอัปโหลดสลิป */}
          <div className="mt-4">
            <label className={`block w-full py-3 px-4 rounded-2xl text-[10px] font-black uppercase cursor-pointer transition-all
              ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}>
              {uploading ? 'กำลังอัปโหลด...' : '📸 ยืนยันการโอน (แนบสลิป)'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading} />
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
