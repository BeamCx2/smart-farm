import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QRCodeCanvas } from 'qrcode.react';
import { formatTHB } from '../lib/utils';
import app from '../lib/firebase'; 
import jsQR from 'jsqr'; 

export default function Payment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { amount, orderId } = location.state || { amount: 0, orderId: 'N/A' };

    const [qrRawData, setQrRawData] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const storage = getStorage(app);
    const functions = getFunctions(app, 'asia-southeast1'); 
    const getSCBQR = httpsCallable(functions, 'getscbqr');

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

    // 📸 ฟังก์ชันอ่าน QR Payload จากรูปภาพ (Client-side Scan)
    const scanQRCode = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) resolve(code.data);
                    else reject("ไม่พบ QR Code ในรูปสลิป กรุณาใช้รูปต้นฉบับครับ");
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUploadSlip = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. สแกนหา Payload
            const payload = await scanQRCode(file);

            // 2. ตรวจสอบผ่าน API v2
            const verifyRes = await fetch('/.netlify/functions/verify-slip', {
                method: 'POST',
                body: JSON.stringify({ payload: payload }) 
            });
            
            const result = await verifyRes.json();

            if (result.success) {
                const slipData = result.data;
                
                // 🔍 เช็คยอดเงิน (Amount)
                const slipAmount = slipData.amount || 0;
                const isAmountMatch = Math.abs(Number(slipAmount) - Number(amount)) < 0.1;
                
                // 🔍 เช็คชื่อผู้รับ (Receiver) - ปรับปรุงให้ปลอดภัยด้วย ?. 
                const receiverName = (slipData.receiver?.name || "").toLowerCase();
                const isReceiverMatch = receiverName.includes("ณัฐวุฒิ") || receiverName.includes("nattawut");

                if (isAmountMatch && isReceiverMatch) {
                    // ✅ ผ่านเงื่อนไขจริง -> อัปโหลดและบันทึก
                    const storageRef = ref(storage, `slips/${orderId}_${Date.now()}.jpg`);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);

                    const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
                    const snap = await getDocs(q);

                    if (!snap.empty) {
                        await updateDoc(snap.docs[0].ref, {
                            status: 'paid',
                            slipUrl: downloadURL,
                            verifiedBy: 'EasySlip v2 Auto',
                            updatedAt: serverTimestamp(),
                            transRef: slipData.transRef || 'N/A'
                        });
                        alert("✅ ชำระเงินสำเร็จ! ระบบตรวจสอบข้อมูลถูกต้องครับ");
                        navigate('/orders'); 
                    }
                } else {
                    alert(`❌ ข้อมูลไม่ตรง!\nผู้รับในสลิป: ${receiverName || "ไม่ทราบชื่อ"}\nยอดเงินในสลิป: ${slipAmount} บาท`);
                }
            } else {
                alert(`❌ ตรวจสอบล้มเหลว: ${result.error || "สลิปไม่ถูกต้อง"}`);
            }
        } catch (error) {
            alert(`⚠️ ข้อผิดพลาด: ${error}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="max-w-sm w-full">
                <h1 className="text-xl font-black mb-1 text-gray-800 uppercase tracking-tighter">Smart Farm Payment</h1>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-8">Gateway v2.0</p>

                <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 mb-6 bg-gray-50/30 shadow-inner">
                    <div className="mb-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">ยอดชำระทั้งสิ้น</p>
                        <p className="text-4xl font-black text-gray-900 leading-none">{formatTHB(amount)}</p>
                    </div>

                    <div className="flex justify-center bg-white p-6 rounded-[2rem] shadow-xl shadow-emerald-500/5 border border-gray-50 mb-6">
                        {loading ? (
                            <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full"></div>
                        ) : qrRawData ? (
                            <QRCodeCanvas value={qrRawData} size={200} />
                        ) : (
                            <p className="text-xs text-gray-400 font-black uppercase">Generating QR...</p>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className={`block w-full py-4 px-4 rounded-2xl text-[10px] font-black uppercase cursor-pointer transition-all shadow-lg active:scale-95
                            ${uploading ? 'bg-gray-200 text-gray-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            {uploading ? '⚙️ Processing...' : '📸 ยืนยันการโอน (แนบสลิป)'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading || loading} />
                        </label>
                    </div>
                </div>

                <p className="text-[9px] font-black text-gray-300 px-10 leading-relaxed uppercase tracking-[0.2em]">
                    Instant confirmation via <br/> EasySlip API v2.0
                </p>
            </div>
        </div>
    );
}
