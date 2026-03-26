import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QRCodeCanvas } from 'qrcode.react';
import { formatTHB } from '../lib/utils';
import app from '../lib/firebase'; 

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, orderId } = location.state || { amount: 0, orderId: 'N/A' };

  const [qrRawData, setQrRawData] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const functions = getFunctions(app, 'asia-southeast1'); 
  const getSCBQR = httpsCallable(functions, 'getscbqr');
  const storage = getStorage(app);

  useEffect(() => {
    const handleGenerateQR = async () => {
      if (amount <= 0) return;
      setLoading(true);
      try {
        const result = await getSCBQR({ amount, orderId });
        if (result.data?.qrRawData) setQrRawData(result.data.qrRawData);
      } catch (error) { console.error("QR Error:", error); }
      finally { setLoading(false); }
    };
    handleGenerateQR();
  }, [amount, orderId]);

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

        if (verifyRes.status === 200 && result.status === 200) {
          const slipData = result.data;
          
          // 🔍 1. เช็คยอดเงิน (ต้องต่างกันไม่เกิน 0.01 บาท)
          const isAmountMatch = Math.abs(Number(slipData.amount.amount) - Number(amount)) < 0.01;
          
          // 🔍 2. เช็คชื่อผู้รับ (บอสเปลี่ยนชื่อ "ณัฐวุฒิ" ให้ตรงกับในแอปธนาคารนะครับ)
          const isReceiverMatch = slipData.receiver.displayName.includes("ณัฐวุฒิ");

          if (isAmountMatch && isReceiverMatch) {
            // ✅ ของจริง: อัปโหลดและบันทึก
            const storageRef = ref(storage, `slips/${orderId}_${Date.now()}.jpg`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
            const snap = await getDocs(q);

            if (!snap.empty) {
              await updateDoc(snap.docs[0].ref, {
                status: 'paid',
                slipUrl: downloadURL,
                verifiedBy: 'EasySlip Auto',
                updatedAt: serverTimestamp(),
                transRef: slipData.transRef
              });
              alert("✅ ชำระเงินสำเร็จ! ระบบตรวจสอบสลิปถูกต้องครับ");
              navigate('/orders'); 
            }
          } else {
            alert(`❌ ข้อมูลไม่ตรง!\nยอดในสลิป: ${slipData.amount.amount} บาท\nยอดที่ต้องโอน: ${amount} บาท`);
          }
        } else {
          alert(`❌ สลิปไม่ถูกต้อง: ${result.message || "กรุณาใช้สลิปใหม่ที่มี QR Code ชัดเจน"}`);
        }
      } catch (error) {
        alert("⚠️ เกิดข้อผิดพลาดในการตรวจสอบ");
      } finally {
        setUploading(false);
      }
    };
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-sm w-full">
        <h1 className="text-xl font-black mb-1 text-gray-800">ชำระเงินค่าสินค้า</h1>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-8">Smart Farm Official</p>

        <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 mb-6 bg-gray-50/30">
          <div className="mb-6">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Amount</p>
            <p className="text-4xl font-black text-gray-900">{formatTHB(amount)}</p>
          </div>

          <div className="flex justify-center bg-white p-6 rounded-[2rem] shadow-xl border border-gray-50 mb-6">
            {loading ? <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full" /> : 
             qrRawData ? <QRCodeCanvas value={qrRawData} size={200} /> : <p className="text-xs text-gray-400">Loading QR...</p>}
          </div>

          <div className="mt-4">
            <label className={`block w-full py-4 px-4 rounded-2xl text-[10px] font-black uppercase cursor-pointer transition-all
              ${uploading ? 'bg-gray-200 text-gray-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'}`}>
              {uploading ? '⚙️ Verifying...' : '📸 Upload Slip'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading || loading} />
            </label>
          </div>
        </div>
        <p className="text-[10px] font-bold text-gray-400 px-10 leading-relaxed uppercase tracking-widest">
          Please upload the original bank slip <br/> for automatic verification.
        </p>
      </div>
    </div>
  );
}
