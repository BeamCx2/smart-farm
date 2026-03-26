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
    
    const [statusModal, setStatusModal] = useState({ 
        show: false, 
        success: false, 
        message: '', 
        details: null 
    });

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
                    else reject("ไม่พบ QR Code ในรูปสลิป กรุณาใช้รูปต้นฉบับ");
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
            const payload = await scanQRCode(file);
            const verifyRes = await fetch('/.netlify/functions/verify-slip', {
                method: 'POST',
                body: JSON.stringify({ payload: payload }) 
            });
            
            const result = await verifyRes.json();

            if (result.success) {
                const slipData = result.data;
                
                // 📍 แก้ไขจุดที่ 1: ดึงยอดเงินแบบ V2 (Dashboard บอสโชว์ 254.00)
                const slipAmount = slipData.amount?.amount || 0; 
                
                // 📍 แก้ไขจุดที่ 2: เช็คชื่อผู้รับ (อิงตามรูปที่ 169)
                const receiverName = (slipData.receiver?.name || "").toLowerCase();
                const isReceiverMatch = 
                    receiverName.includes("ณัฐวุฒิ") || 
                    receiverName.includes("nattawut") ||
                    receiverName.includes("pakdeeamnaj");

                // 📍 แก้ไขจุดที่ 3: เช็คยอดเงินที่ต้องชำระ
                const isAmountMatch = Math.abs(Number(slipAmount) - Number(amount)) < 0.1;

                if (isAmountMatch && isReceiverMatch) {
                    const storageRef = ref(storage, `slips/${orderId}_${Date.now()}.jpg`);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);

                    const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
                    const snap = await getDocs(q);

                    if (!snap.empty) {
                        await updateDoc(snap.docs[0].ref, {
                            status: 'paid',
                            slipUrl: downloadURL,
                            verifiedBy: 'EasySlip v2.0 Auto',
                            updatedAt: serverTimestamp(),
                            transRef: slipData.transRef || 'N/A'
                        });
                        
                        setStatusModal({
                            show: true,
                            success: true,
                            message: 'ชำระเงินสำเร็จ!',
                            details: 'ระบบตรวจสอบข้อมูลถูกต้อง ขอบคุณที่อุดหนุนครับ'
                        });
                    }
                } else {
                    // ❌ แสดง Error เมื่อข้อมูลไม่ตรง (ยอดเงิน หรือ ชื่อ)
                    setStatusModal({
                        show: true,
                        success: false,
                        message: 'ข้อมูลไม่ตรง!',
                        details: `ผู้รับ: ${slipData.receiver?.name || "ไม่ทราบชื่อ"} | ยอดโอน: ${slipAmount} บาท (ยอดที่ต้องชำระ: ${amount} บาท)`
                    });
                }
            } else {
                setStatusModal({
                    show: true,
                    success: false,
                    message: 'สลิปไม่ถูกต้อง',
                    details: result.error || 'กรุณาใช้สลิปที่มี QR Code ที่ชัดเจน'
                });
            }
        } catch (error) {
            setStatusModal({
                show: true,
                success: false,
                message: 'เกิดข้อผิดพลาด',
                details: error.toString()
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans relative">
            <div className="max-w-sm w-full animate-in fade-in zoom-in duration-500">
                <h1 className="text-xl font-black mb-1 text-gray-800 tracking-tighter uppercase">Payment Gateway</h1>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 border-b pb-2">Smart Farm Official</p>

                <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 mb-6 bg-gray-50/30 shadow-inner">
                    <div className="mb-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">ยอดชำระทั้งสิ้น</p>
                        <p className="text-4xl font-black text-gray-900 leading-none">{formatTHB(amount)}</p>
                    </div>

                    <div className="flex justify-center bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-500/5 border border-gray-50 mb-6 transition-transform hover:scale-[1.02]">
                        {loading ? (
                            <div className="animate-spin h-10 w-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full"></div>
                        ) : qrRawData ? (
                            <QRCodeCanvas value={qrRawData} size={200} />
                        ) : (
                            <p className="text-xs text-gray-300 font-black uppercase">Initializing QR...</p>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className={`block w-full py-5 px-4 rounded-[1.5rem] text-[10px] font-black uppercase cursor-pointer transition-all shadow-xl active:scale-95
                            ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}>
                            {uploading ? '⚙️ Verifying...' : '📸 ยืนยันการโอน (แนบสลิป)'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading || loading} />
                        </label>
                    </div>
                </div>

                <p className="text-[9px] font-black text-gray-300 px-10 leading-relaxed uppercase tracking-[0.2em]">
                    Powered by EasySlip API v2.0 <br/> Automatic Verification System
                </p>
            </div>

            {statusModal.show && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
                        <div className={`w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center text-4xl shadow-xl
                            ${statusModal.success ? 'bg-emerald-50 text-emerald-500 shadow-emerald-100' : 'bg-red-50 text-red-500 shadow-red-100'}`}>
                            {statusModal.success ? '✓' : '✕'}
                        </div>
                        
                        <h2 className={`text-2xl font-black mb-3 tracking-tighter ${statusModal.success ? 'text-emerald-900' : 'text-red-900'}`}>
                            {statusModal.message}
                        </h2>
                        
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-relaxed mb-10 px-2 font-black">
                            {statusModal.details}
                        </p>

                        <button
                            onClick={() => {
                                setStatusModal({ ...statusModal, show: false });
                                if (statusModal.success) navigate('/orders');
                            }}
                            className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl
                                ${statusModal.success ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-gray-900 text-white shadow-gray-300'}`}
                        >
                            {statusModal.success ? 'ไปที่รายการสั่งซื้อ' : 'ลองใหม่อีกครั้ง'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
