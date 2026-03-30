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

    // 🚀 ดึง QR Code จาก Netlify Function
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
                if (result.raw) {
                    setQrRawData(result.raw);
                }
            } catch (error) {
                console.error("QR Error:", error);
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
                const verifyRes = await fetch('/.netlify/functions/verify-slip', {
                    method: 'POST',
                    body: JSON.stringify({ image: base64Image }) 
                });
                const result = await verifyRes.json();

                if (result && result.data) {
                    const slipData = result.data;
                    const transRef = slipData.transRef;

                    // 🛡️ เช็คสลิปซ้ำ
                    const duplicateQuery = query(collection(db, 'orders'), where('transRef', '==', transRef));
                    const duplicateSnap = await getDocs(duplicateQuery);
                    if (!duplicateSnap.empty) {
                        setUploading(false);
                        return setStatusModal({ show: true, success: false, message: 'สลิปนี้ถูกใช้งานไปแล้ว!', details: `รหัส ${transRef} มีในระบบแล้ว` });
                    }

                    // 💰 เช็คยอด (โอนขาด/เกิน)
                    const slipAmount = slipData.amount?.amount || slipData.amount || 0;
                    if (Math.abs(Number(slipAmount) - Number(amount)) > 0.1) {
                        setUploading(false);
                        return setStatusModal({ show: true, success: false, message: 'ยอดเงินไม่ตรง!', details: `ในสลิป ${slipAmount} บ. (ต้องจ่าย ${amount} บ.)` });
                    }

                    // ✅ ผ่าน -> อัปโหลด -> ตัดสต๊อก -> อัปเดต DB
                    const storageRef = ref(storage, `slips/${orderId}_${Date.now()}.jpg`);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);

                    const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
                    const snap = await getDocs(q);

                    if (!snap.empty) {
                        const orderDoc = snap.docs[0];
                        const orderData = orderDoc.data();
                        const updateStockPromises = (orderData.items || []).map(item => 
                            updateDoc(doc(db, 'products', item.id), { stock: increment(-item.qty) })
                        );
                        await Promise.all(updateStockPromises);
                        await updateDoc(orderDoc.ref, { status: 'paid', slipUrl: downloadURL, transRef: transRef, updatedAt: serverTimestamp() });
                        
                        setUploading(false);
                        setStatusModal({ show: true, success: true, message: 'ชำระเงินสำเร็จ!', details: `ออเดอร์ #${orderId} ยืนยันเรียบร้อย` });
                    }
                } else {
                    setUploading(false);
                    setStatusModal({ show: true, success: false, message: 'สลิปไม่ถูกต้อง', details: 'ระบบไม่พบ QR Code ในรูปภาพ' });
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
                <h1 className="text-xl font-black mb-1 text-gray-800 tracking-tighter leading-none">Smart Farm Gateway</h1>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 border-b pb-2 leading-none">Hybrid V1+V2 System</p>

                <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 mb-6 bg-gray-50/30 shadow-inner font-black">
                    <div className="mb-6 leading-none font-black">
                        <p className="text-[10px] text-gray-400 uppercase mb-1 tracking-widest font-black leading-none font-black">Order ID: #{orderId}</p>
                        <p className="text-4xl font-black text-gray-900 leading-none">{formatTHB(amount)}</p>
                    </div>

                    <div className="flex justify-center bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-500/5 border border-gray-50 mb-6 transition-transform hover:scale-[1.02]">
                        {loading ? (
                            <div className="animate-spin h-10 w-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full"></div>
                        ) : qrRawData ? (
                            <QRCodeCanvas value={qrRawData} size={200} />
                        ) : (
                            <p className="text-xs text-gray-300 font-black italic uppercase leading-none font-black">Initializing QR...</p>
                        )}
                    </div>

                    <div className="mt-4 leading-none font-black">
                        <label className={`block w-full py-5 px-4 rounded-[1.5rem] text-[10px] font-black uppercase cursor-pointer transition-all shadow-xl active:scale-95 leading-none font-black
                            ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}>
                            {uploading ? '⚙️ Verifying...' : '📸 ยืนยันการโอน (แนบสลิป)'}
                            <input id="slip-upload-input" type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading || loading} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {statusModal.show && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 font-black">
                    <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center font-black animate-in zoom-in-95">
                        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl ${statusModal.success ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                            {statusModal.success ? '✓' : '✕'}
                        </div>
                        <h2 className={`text-xl font-black mb-2 ${statusModal.success ? 'text-emerald-900' : 'text-red-900'}`}>{statusModal.message}</h2>
                        <p className="text-[11px] text-gray-400 uppercase tracking-widest leading-relaxed mb-8">{statusModal.details}</p>
                        <button onClick={statusModal.success ? () => navigate('/orders') : closeModal} className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest ${statusModal.success ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white'}`}>
                            {statusModal.success ? 'รายการสั่งซื้อ' : 'ลองใหม่'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
