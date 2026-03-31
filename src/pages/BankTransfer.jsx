import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
    collection, query, where, getDocs, updateDoc, 
    serverTimestamp, doc, increment 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatTHB } from '../lib/utils';
import app from '../lib/firebase'; 
import jsQR from 'jsqr'; 

export default function BankTransfer() {
    const location = useLocation();
    const navigate = useNavigate();
    const { amount, orderId } = location.state || { amount: 0, orderId: 'N/A' };

    const [uploading, setUploading] = useState(false);
    const [statusModal, setStatusModal] = useState({ show: false, success: false, message: '', details: null });

    const storage = getStorage(app);

    // 🔍 1. ฟังก์ชันสแกน QR Payload (เหมือนหน้า Payment)
    const scanSlipForPayload = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width; canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    resolve(code ? code.data : null);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    // 🚀 2. ฟังก์ชันหลักในการอัปโหลดและตรวจสอบ (โครงสร้างเดียวกับ Payment)
    const handleUploadSlip = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const payload = await scanSlipForPayload(file);
            if (!payload) {
                setUploading(false);
                return setStatusModal({ show: true, success: false, message: 'ไม่พบ QR Code', details: 'กรุณาใช้สลิปดั้งเดิมที่มี Mini QR ชัดเจน' });
            }

            const verifyRes = await fetch('/.netlify/functions/verify-slip', {
                method: 'POST',
                body: JSON.stringify({ payload: payload }) 
            });
            const result = await verifyRes.json();

            // ✨ [Logic Check]: ตรวจสอบข้อมูลจาก EasySlip V2 (เลียนแบบหน้า Payment)
            if (result && (result.event === "FOUND" || result.status === 200)) {
                
                const slipData = result.data?.rawSlip || result.data || result;
                const transRef = slipData.transRef;

                // 🛡️ 📍 [Triple Lock System]: ดึงค่ามาตรวจสอบ
                const receiverName = slipData.receiver?.account?.name?.th || "";
                
                // ดึงเลขบัญชีธนาคาร (ต่างจาก Payment ที่ดึง Proxy)
                const receiverAccount = slipData.receiver?.account?.bank?.account || "";

                // 🚀 ตรวจสอบชื่อ "ณัฐวุฒิ" และ เลขบัญชีกสิกร "8656"
                // ใช้ replace(/\s/g, "") เพื่อลบช่องว่างตามที่ตรวจเจอในสลิปกสิกรของบอส
                const isCorrectName = receiverName.replace(/\s/g, "").includes("ณัฐวุฒิ");
                const isCorrectAccount = receiverAccount.includes("8656");

                if (!isCorrectName || !isCorrectAccount) {
                    setUploading(false);
                    return setStatusModal({ 
                        show: true, 
                        success: false, 
                        message: 'บัญชีผู้รับไม่ถูกต้อง', 
                        details: `สลิปโอนไปที่: ${receiverName} (${receiverAccount}) โปรดโอนเข้ากสิกรไทย 063-8-98656-6` 
                    });
                }

                if (!transRef) {
                    setUploading(false);
                    return setStatusModal({ show: true, success: false, message: 'ข้อมูลสลิปไม่สมบูรณ์', details: 'หาเลขที่ธุรกรรมไม่เจอ' });
                }

                // 🛡️ [ด่านเช็คสลิปซ้ำ]
                const duplicateQuery = query(collection(db, 'orders'), where('transRef', '==', transRef));
                const duplicateSnap = await getDocs(duplicateQuery);
                if (!duplicateSnap.empty) {
                    setUploading(false);
                    return setStatusModal({ show: true, success: false, message: 'สลิปนี้เคยใช้ไปแล้ว!', details: `รหัสธุรกรรม ${transRef} มีการบันทึกแล้ว` });
                }

                // 💰 [ด่านตรวจสอบยอดเงิน]
                const slipAmount = result.data?.amountInSlip || slipData.amount?.amount || 0;
                if (Math.abs(Number(slipAmount) - Number(amount)) > 1) { // เผื่อส่วนต่าง 1 บาทกันพลาด
                    setUploading(false);
                    return setStatusModal({ show: true, success: false, message: 'ยอดเงินโอนไม่ตรง!', details: `โอนจริง ${slipAmount} บ. (ยอดออเดอร์ ${amount} บ.)` });
                }

                // ✅ [ผ่านด่าน]: บันทึกสลิปลง Storage และอัปเดต Firebase
                const storageRef = ref(storage, `slips/${orderId}_${Date.now()}.jpg`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const orderDoc = snap.docs[0];
                    const orderData = orderDoc.data();
                    
                    // ตัดสต๊อกสินค้า
                    const updateStockPromises = (orderData.items || []).map(item => 
                        updateDoc(doc(db, 'products', item.id), { stock: increment(-item.qty) })
                    );
                    await Promise.all(updateStockPromises);
                    
                    // อัปเดตสถานะออเดอร์
                    await updateDoc(orderDoc.ref, { 
                        status: 'paid', 
                        slipUrl: downloadURL, 
                        transRef: transRef, 
                        updatedAt: serverTimestamp(),
                        verifiedBy: 'Bank Transfer Triple Lock (Name/Acc/Amount)'
                    });
                    
                    setUploading(false);
                    setStatusModal({ show: true, success: true, message: 'แจ้งโอนสำเร็จ!', details: 'ตรวจสอบยอดเงินและบัญชีรับเงินถูกต้อง' });
                }
            } else {
                setUploading(false);
                setStatusModal({ show: true, success: false, message: 'ตรวจสอบไม่สำเร็จ', details: 'ข้อมูลสลิปนี้ไม่ผ่านการตรวจสอบจากระบบ' });
            }
        } catch (error) {
            setUploading(false);
            setStatusModal({ show: true, success: false, message: 'เกิดข้อผิดพลาด', details: error.message });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans font-black uppercase">
            <div className="max-w-sm w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-500">
                <h1 className="text-xl font-black mb-1 text-gray-800 tracking-tighter leading-none">Bank Transfer</h1>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-10 border-b pb-2 leading-none">K-BANK PAYMENT</p>

                {/* 💳 บัตรกสิกรไทย */}
                <div className="bg-emerald-700 rounded-[2.5rem] p-8 text-white mb-8 text-left relative overflow-hidden shadow-xl">
                    <p className="text-[9px] text-emerald-200 tracking-[0.3em] font-black mb-4">KASIKORNBANK</p>
                    <p className="text-xl font-black tracking-widest mb-1">063 - 8 - 98656 - 6</p>
                    <p className="text-[10px] font-black text-white/80 mb-6 uppercase tracking-widest">NATTAWUT P.</p>
                    
                    <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl">
                         <div>
                            <p className="text-[8px] text-emerald-200 font-black uppercase">Amount</p>
                            <p className="text-lg font-black">{formatTHB(amount)}</p>
                         </div>
                         <button onClick={() => {
                            navigator.clipboard.writeText("0638986566");
                            alert("คัดลอกเลขบัญชีแล้ว!");
                         }} className="text-[9px] bg-white text-emerald-700 px-4 py-2 rounded-xl font-black">COPY</button>
                    </div>
                </div>

                <label className={`block w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase cursor-pointer transition-all shadow-xl active:scale-95
                    ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white hover:bg-black'}`}>
                    {uploading ? '⚙️ AI Verifying...' : '📸 ยืนยันการโอน'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading} />
                </label>
            </div>

            {/* Modal แจ้งผล (โครงสร้างเดียวกับ Payment) */}
            {statusModal.show && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center">
                        <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-black ${statusModal.success ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                            {statusModal.success ? '✓' : '✕'}
                        </div>
                        <h2 className="text-xl font-black mb-2">{statusModal.message}</h2>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-8 font-black">{statusModal.details}</p>
                        <button onClick={statusModal.success ? () => navigate(`/receipt/${orderId}`) : () => setStatusModal({...statusModal, show: false})} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase ${statusModal.success ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white'}`}>
                            {statusModal.success ? 'ดูใบเสร็จ' : 'ลองใหม่'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
