import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
    collection, query, where, getDocs, updateDoc, 
    serverTimestamp, doc, increment 
} from 'firebase/firestore';
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
    const [statusModal, setStatusModal] = useState({ show: false, success: false, message: '', details: null });

    const storage = getStorage(app);

    // 🚀 📍 ส่วนดึง QR Code (เรียกผ่าน Netlify Function V1)
    useEffect(() => {
        const handleGenerateQR = async () => {
            if (amount <= 0) return;
            setLoading(true);
            try {
                const res = await fetch('/.netlify/functions/generate-qr', {
                    method: 'POST',
                    body: JSON.stringify({ amount, orderId })
                });
                const result = await res.json();
                
                // ✨ 🛡️ ดักทุกจุดที่ข้อมูล QR จะอยู่ (V1 มักอยู่ที่ Root)
                const qrCode = result.raw || result.rawPayload || result.data?.raw || result.data?.payload;
                
                if (qrCode) {
                    setQrRawData(qrCode);
                } else {
                    console.error("QR Code not found in response:", result);
                }
            } catch (error) {
                console.error("Fetch QR Error:", error);
            } finally {
                setLoading(false);
            }
        };
        handleGenerateQR();
    }, [amount, orderId]);

    const closeModal = () => {
        setStatusModal({ ...statusModal, show: false });
        const fileInput = document.getElementById('slip-upload-input');
        if (fileInput) fileInput.value = ""; 
    };

    const handleUploadSlip = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Image = reader.result.split(',')[1]; 

                // 🚀 1. ตรวจสอบสลิปผ่าน EasySlip V2
                const verifyRes = await fetch('/.netlify/functions/verify-slip', {
                    method: 'POST',
                    body: JSON.stringify({ image: base64Image }) 
                });
                
                const result = await verifyRes.json();

                // 🛡️ ด่านที่ 1: เช็คสถานะ V2
                if (result && result.data) {
                    const slipData = result.data; 
                    const transRef = slipData.transRef; 

                    if (!transRef) throw new Error("ไม่พบรหัสธุรกรรมบนสลิป");

                    // 🛡️ ด่านที่ 2: เช็คสลิปซ้ำ
                    const duplicateQuery = query(collection(db, 'orders'), where('transRef', '==', transRef));
                    const duplicateSnap = await getDocs(duplicateQuery);

                    if (!duplicateSnap.empty) {
                        setUploading(false);
                        return setStatusModal({
                            show: true, success: false,
                            message: 'สลิปนี้ถูกใช้งานไปแล้ว!',
                            details: `รหัสธุรกรรม ${transRef} มีอยู่ในระบบแล้ว`
                        });
                    }

                    // 💰 ด่านที่ 3: เช็คยอดเงิน
                    const slipAmount = slipData.amount?.amount || slipData.amount || 0; 
                    const isAmountMatch = Math.abs(Number(slipAmount) - Number(amount)) < 0.1;

                    if (!isAmountMatch) {
                        setUploading(false);
                        return setStatusModal({
                            show: true, success: false,
                            message: 'ยอดเงินไม่ตรง!',
                            details: `ในสลิป: ${slipAmount} บาท (ต้องชำระ: ${amount} บาท)`
                        });
                    }

                    // 👤 ด่านที่ 4: เช็คชื่อผู้รับเงิน
                    const nameTH = slipData.receiver?.account?.name?.th || slipData.receiver?.name || "";
                    if (!nameTH.includes("ณัฐวุฒิ")) {
                        setUploading(false);
                        return setStatusModal({
                            show: true, success: false,
                            message: 'บัญชีผู้รับไม่ถูกต้อง!',
                            details: `สลิปโอนไปที่: ${nameTH || "Unknown"}`
                        });
                    }

                    // 📦 ด่านที่ 5: อัปโหลดสลิปจริง -> ตัดสต๊อก -> อัปเดต DB
                    const storageRef = ref(storage, `slips/${orderId}_${Date.now()}.jpg`);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);

                    const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
                    const snap = await getDocs(q);

                    if (!snap.empty) {
                        const orderDoc = snap.docs[0];
                        const orderData = orderDoc.data();

                        // 🔥 ตัดสต๊อกจริงจังหวะจ่ายเงินสำเร็จ
                        const updateStockPromises = (orderData.items || []).map(async (item) => {
                            const productRef = doc(db, 'products', item.id);
                            return updateDoc(productRef, { stock: increment(-item.qty) });
                        });
                        await Promise.all(updateStockPromises);

                        await updateDoc(orderDoc.ref, {
                            status: 'paid',
                            slipUrl: downloadURL,
                            transRef: transRef,
                            updatedAt: serverTimestamp(),
                            verifiedBy: 'Secure Hybrid V2'
                        });
                        
                        setUploading(false);
                        setStatusModal({
                            show: true, success: true,
                            message: 'ชำระเงินสำเร็จ!',
                            details: `เลขธุรกรรม: ${transRef} บันทึกเรียบร้อย`
                        });
                    }
                } else {
                    setUploading(false);
                    setStatusModal({
                        show: true, success: false,
                        message: 'สลิปไม่ถูกต้อง',
                        details: result?.message || 'NOT_FOUND: ระบบไม่พบข้อมูล QR Code ในรูปภาพ'
                    });
                }
            };
        } catch (error) {
            setUploading(false);
            setStatusModal({ show: true, success: false, message: 'เกิดข้อผิดพลาด', details: error.message });
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans font-black uppercase">
            <div className="max-w-sm w-full animate-in fade-in zoom-in duration-500 font-black">
                <h1 className="text-xl font-black mb-1 text-gray-800 tracking-tighter leading-none font-black">Smart Farm Gateway</h1>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 border-b pb-2 leading-none font-black">Hybrid V1+V2 System</p>

                <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 mb-6 bg-gray-50/30 shadow-inner font-black">
                    <div className="mb-6 leading-none">
                        <p className="text-[10px] text-gray-400 uppercase mb-1 tracking-widest font-black leading-none">Order ID: #{orderId}</p>
                        <p className="text-4xl font-black text-gray-900 leading-none">{formatTHB(amount)}</p>
                    </div>

                    <div className="flex justify-center bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-500/5 border border-gray-50 mb-6 transition-transform hover:scale-[1.02]">
                        {loading ? (
                            <div className="animate-spin h-10 w-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full font-black"></div>
                        ) : qrRawData ? (
                            <QRCodeCanvas value={qrRawData} size={200} />
                        ) : (
                            <p className="text-xs text-gray-300 font-black italic uppercase leading-none font-black">Initializing QR...</p>
                        )}
                    </div>

                    {/* ✅ 📍 แก้ไขจุด Unterminated String ตรงนี้แล้วครับ */}
                    <div className="mt-4 leading-none">
                        <label className={`block w-full py-5 px-4 rounded-[1.5rem] text-[10px] font-black uppercase cursor-pointer transition-all shadow-xl active:scale-95 leading-none
                            ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}>
                            {uploading ? '⚙️ Verifying...' : '📸 ยืนยันการโอน (แนบสลิป)'}
                            <input id="slip-upload-input" type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading || loading} />
                        </label>
                    </div>
                </div>

                <p className="text-[9px] font-black text-gray-300 px-10 leading-relaxed uppercase tracking-[0.2em] leading-none font-black">
                    V1 Generation + V2 Verification <br/> Auto-Stock Deduction Enabled
                </p>
            </div>

            {/* Modal ผลลัพธ์ */}
            {statusModal.show && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-200 font-black">
                        <div className={`w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center text-4xl shadow-xl leading-none
                            ${statusModal.success ? 'bg-emerald-50 text-emerald-500 shadow-emerald-100 font-black' : 'bg-red-50 text-red-500 shadow-red-100 font-black'}`}>
                            {statusModal.success ? '✓' : '✕'}
                        </div>
                        <h2 className={`text-2xl font-black mb-3 tracking-tighter leading-none ${statusModal.success ? 'text-emerald-900' : 'text-red-900'}`}>
                            {statusModal.message}
                        </h2>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-relaxed mb-10 px-2 leading-none">
                            {statusModal.details}
                        </p>
                        <button
                            onClick={statusModal.success ? () => navigate('/orders') : closeModal}
                            className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl leading-none
                                ${statusModal.success ? 'bg-emerald-600 text-white shadow-emerald-200 font-black' : 'bg-gray-900 text-white shadow-gray-300 font-black'}`}
                        >
                            {statusModal.success ? 'ไปที่รายการสั่งซื้อ' : 'ลองใหม่อีกครั้ง'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
