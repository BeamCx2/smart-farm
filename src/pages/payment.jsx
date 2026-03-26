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
const handleUploadSlip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result.split(',')[1];

      try {
        const verifyRes = await fetch('/.netlify/functions/verify-slip', {
          method: 'POST',
          body: JSON.stringify({ imageBase64: base64Image })
        });
        
        const result = await verifyRes.json();
        console.log("🔍 EasySlip Raw Data:", result); // บอสดูใน Console นะครับ

        if (result.status === 200) {
          const slipData = result.data;
          
          // 🚨 จุดแก้ไข 1: แปลงยอดเงินเป็น Number ทั้งคู่ก่อนเทียบ
          const slipAmount = Number(slipData.amount.amount);
          const targetAmount = Number(amount);
          
          const isAmountCorrect = Math.abs(slipAmount - targetAmount) < 0.01;

          // 🚨 จุดแก้ไข 2: บอสต้องเปลี่ยนคำว่า "ณัฐวุฒิ" ให้ตรงกับชื่อบัญชีที่ EasySlip อ่านได้
          // ผมแนะนำให้บอสดูจาก Console ว่า result.data.receiver.displayName มันคือคำว่าอะไร
          const isReceiverCorrect = slipData.receiver.displayName.includes("ณัฐวุฒิ"); 

          if (isAmountCorrect && isReceiverCorrect) {
            // ✅ สลิปถูกต้อง -> อัปโหลดรูปเก็บไว้
            const storageRef = ref(storage, `slips/${orderId}_${Date.now()}.jpg`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // อัปเดต Firestore
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('orderId', '==', orderId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const orderDoc = querySnapshot.docs[0].ref;
              await updateDoc(orderDoc, {
                status: 'paid',
                slipUrl: downloadURL,
                verifiedBy: 'EasySlip Auto',
                updatedAt: new Date(),
                transRef: slipData.transRef
              });

              alert("✅ ชำระเงินสำเร็จ! ระบบตรวจสอบสลิปเรียบร้อยครับ");
              navigate('/orders'); 
            }
          } else {
            // 💡 ถ้าไม่ผ่าน จะได้รู้ว่าตัวไหนพัง!
            alert(`❌ ข้อมูลไม่ตรงครับบอส!\n\nยอดเงินตรงมั้ย: ${isAmountCorrect} (สลิป: ${slipAmount} | เป้าหมาย: ${targetAmount})\nชื่อบัญชีตรงมั้ย: ${isReceiverCorrect} (ในสลิปอ่านได้: ${slipData.receiver.displayName})`);
          }
        } else {
          // ถ้า EasySlip ปฏิเสธ (เช่น สลิปเก่า หรือรูปไม่ชัด)
          alert(`❌ สลิปไม่ถูกต้อง: ${result.message || "กรุณาใช้สลิปใหม่ที่ชัดเจน"}`);
        }
      } catch (error) {
        console.error("Verification Error:", error);
        alert("⚠️ ระบบตรวจสอบขัดข้อง (เช็คเน็ตหรือเช็ค Token ใน Function นะครับ)");
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
