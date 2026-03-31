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

    // 🔍 [สแกนสลิป]: อ่าน Payload เพื่อดึงข้อมูลธนาคาร
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

    const handleUploadSlip = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const payload = await scanSlipForPayload(file);
            if (!payload) {
                setUploading(false);
                return setStatusModal({ show: true, success: false, message: 'ไม่พบ QR Code', details: 'กรุณาใช้สลิปดั้งเดิมที่มี Mini QR' });
            }

            const verifyRes = await fetch('/.netlify/functions/verify-slip', {
                method: 'POST',
                body: JSON.stringify({ payload }) 
            });
            const result = await verifyRes.json();

            if (result && (result.event === "FOUND" || result.status === 200)) {
                const slipData = result.data?.rawSlip || result.data || result;
                
                // 🛡️ [Triple Lock]: เช็คชื่อ "ณัฐวุฒิ" และเลขบัญชีกสิกร "8656"
                const receiverName = slipData.receiver?.account?.name?.th || "";
                const receiverAccount = slipData.receiver?.account?.bank?.account || 
                                        slipData.receiver?.account?.proxy?.account || "";

                // ล็อคเป้าหมายเลข 0638986566 (เราเช็คเลขท้าย 4-6 ตัวเพื่อความแม่นยำ)
                const isCorrectAccount = receiverAccount.includes("6566") || receiverAccount.includes("0638986566");
                const isCorrectName = receiverName.includes("ณัฐวุฒิ");

                if (!isCorrectName || !isCorrectAccount) {
                    setUploading(false);
                    return setStatusModal({ 
                        show: true, success: false, 
                        message: 'บัญชีผู้รับไม่ถูกต้อง', 
                        details: `สลิปนี้โอนไปที่: ${receiverName} (${receiverAccount}) โปรดโอนเข้ากสิกรไทย 063-8-98656-6 เท่านั้น` 
                    });
                }

                // 💰 [Check Amount]
                const slipAmount = result.data?.amountInSlip || 0;
                if (Math.abs(Number(slipAmount) - Number(amount)) > 0.1) {
                    setUploading(false);
                    return setStatusModal({ show: true, success: false, message: 'ยอดโอนไม่ตรง!', details: `ยอดในสลิป ${slipAmount} บ. (ยอดออเดอร์ ${amount} บ.)` });
                }

                // ✅ [Success]: บันทึกและตัดสต๊อก
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
                    
                    await updateDoc(orderDoc.ref, { 
                        status: 'paid', 
                        slipUrl: downloadURL, 
                        transRef: slipData.transRef, 
                        updatedAt: serverTimestamp(),
                        verifiedBy: 'KBANK Manual V2'
                    });
                    
                    setUploading(false);
                    setStatusModal({ show: true, success: true, message: 'แจ้งโอนสำเร็จ!', details: 'ขอบคุณที่อุดหนุน Smart Farm ครับ' });
                }
            } else {
                setUploading(false);
                setStatusModal({ show: true, success: false, message: 'สลิปไม่ถูกต้อง', details: 'ข้อมูลสลิปนี้ตรวจสอบไม่ผ่านระบบ' });
            }
        } catch (error) {
            setUploading(false);
            setStatusModal({ show: true, success: false, message: 'เกิดข้อผิดพลาด', details: error.message });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans font-black uppercase">
            <div className="max-w-sm w-full bg-white rounded-[3rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-500 border border-gray-100">
                <h1 className="text-xl font-black mb-1 text-gray-800 tracking-tighter leading-none">Bank Transfer</h1>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-10 border-b pb-2 leading-none">K-BANKING PAYMENT</p>

                {/* 💳 บัตรธนาคารกสิกรไทย */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2rem] p-8 text-white mb-8 text-left relative overflow-hidden shadow-xl shadow-emerald-200">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-10 -mt-10 rounded-full blur-2xl"></div>
                    <p className="text-[9px] text-emerald-200 tracking-[0.3em] font-black mb-4">KASIKORNBANK</p>
                    <p className="text-xl font-black tracking-widest mb-1">063 - 8 - 98656 - 6</p>
                    <p className="text-[10px] font-black text-white/80 mb-6 uppercase">NATTAWUT P. | SAVINGS</p>
                    
                    <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl backdrop-blur-md">
                         <div>
                            <p className="text-[8px] text-emerald-200 font-black">TOTAL AMOUNT</p>
                            <p className="text-lg font-black">{formatTHB(amount)}</p>
                         </div>
                         <button onClick={() => {
                            navigator.clipboard.writeText("0638986566");
                            alert("คัดลอกเลขบัญชีแล้ว!");
                         }} className="text-[9px] bg-white text-emerald-700 px-4 py-2 rounded-xl font-black">COPY</button>
                    </div>
                </div>

                <p className="text-[10px] text-gray-400 font-black mb-8 leading-relaxed uppercase">
                    โอนเข้าบัญชีกสิกรด้านบน <br/>แล้วแนบรูปสลิปเพื่อยืนยัน
                </p>

                <label className={`block w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase cursor-pointer transition-all shadow-xl active:scale-95
                    ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'}`}>
                    {uploading ? '⚙️ AI Verifying...' : '📸 ยืนยันการโอน'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading} />
                </label>
            </div>

            {statusModal.show && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center">
                        <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-black ${statusModal.success ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                            {statusModal.success ? '✓' : '✕'}
                        </div>
                        <h2 className="text-xl font-black mb-2">{statusModal.message}</h2>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-8">{statusModal.details}</p>
                        <button onClick={statusModal.success ? () => navigate(`/receipt/${orderId}`) : () => setStatusModal({...statusModal, show: false})} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase ${statusModal.success ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-gray-900 text-white'}`}>
                            {statusModal.success ? 'รับใบเสร็จ' : 'ลองใหม่'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
