import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
    collection, query, where, getDocs, updateDoc, 
    serverTimestamp, doc, increment 
} from 'firebase/firestore';
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
    const [statusModal, setStatusModal] = useState({ show: false, success: false, message: '', details: null });

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
            } catch (error) { 
                console.error("QR Generation Error:", error); 
            } finally { 
                setLoading(false); 
            }
        };
        handleGenerateQR();
    }, [amount, orderId]);

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
                return setStatusModal({ show: true, success: false, message: 'ไม่พบ QR Code', details: 'กรุณาใช้รูปสลิปที่มี Mini QR ชัดเจน' });
            }

            const verifyRes = await fetch('/.netlify/functions/verify-slip', {
                method: 'POST',
                body: JSON.stringify({ payload: payload }) 
            });
            const result = await verifyRes.json();

            // ✨ [FIXED LOGIC]: เช็คผ่าน result.success ให้เหมือนหน้า Bank
            if (result && result.success === true) {
                
                const slipResponse = result.data;
                const slipData = slipResponse.rawSlip || slipResponse;
                
                // 🛡️ [Triple Lock]: ดึงค่ามาตรวจสอบ
                const receiverName = slipData.receiver?.account?.name?.th || "";
                const receiverAccount = slipData.receiver?.account?.proxy?.account || 
                                        slipData.receiver?.account?.bank?.account || "";
                const slipAmount = slipResponse.amountInSlip || slipData.amount?.amount || 0;
                const transRef = slipData.transRef;

                // 🚀 ตรวจสอบชื่อ "ณัฐวุฒิ" และ เบอร์พร้อมเพย์ที่ลงท้ายด้วย "4218"
                const isCorrectName = receiverName.replace(/\s/g, "").includes("ณัฐวุฒิ");
                const isCorrectAccount = receiverAccount.includes("4218") || receiverAccount.includes("0822024218");
                const isAmountValid = Math.abs(Number(slipAmount) - Number(amount)) < 1;

                if (!isCorrectName || !isCorrectAccount || !isAmountValid) {
                    setUploading(false);
                    let errorMsg = "";
                    if (!isCorrectName) errorMsg += "[ชื่อผู้รับไม่ตรง] ";
                    if (!isCorrectAccount) errorMsg += "[บัญชีรับเงินไม่ตรง] ";
                    if (!isAmountValid) errorMsg += "[ยอดเงินไม่ตรง] ";

                    return setStatusModal({ 
                        show: true, 
                        success: false, 
                        message: 'ข้อมูลไม่ถูกต้อง', 
                        details: errorMsg + `ตรวจพบ: ${receiverName} (${receiverAccount})` 
                    });
                }

                // 🛡️ [เช็คสลิปซ้ำ]
                const duplicateQuery = query(collection(db, 'orders'), where('transRef', '==', transRef));
                const duplicateSnap = await getDocs(duplicateQuery);
                if (!duplicateSnap.empty) {
                    setUploading(false);
                    return setStatusModal({ show: true, success: false, message: 'สลิปนี้เคยใช้ไปแล้ว!', details: `ธุรกรรม ${transRef} ถูกใช้งานแล้ว` });
                }

                // ✅ [ผ่านด่าน]: บันทึกข้อมูลและตัดสต๊อก
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
                        transRef: transRef, 
                        updatedAt: serverTimestamp(),
                        verifiedBy: 'PromptPay Triple Lock (Stable)'
                    });
                    
                    setUploading(false);
                    setStatusModal({ show: true, success: true, message: 'ชำระเงินสำเร็จ!', details: 'ยืนยันออเดอร์และตัดสต๊อกเรียบร้อย' });
                }
            } else {
                setUploading(false);
                setStatusModal({ 
                    show: true, 
                    success: false, 
                    message: 'สลิปไม่ถูกต้อง', 
                    details: result?.message || 'ข้อมูลตรวจสอบไม่ผ่านจากระบบธนาคาร' 
                });
            }
        } catch (error) {
            setUploading(false);
            setStatusModal({ show: true, success: false, message: 'เกิดข้อผิดพลาด', details: error.message });
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans font-black uppercase tracking-tighter">
            <div className="max-w-sm w-full font-black animate-in fade-in zoom-in duration-500">
                <h1 className="text-xl font-black mb-1 text-gray-800 leading-none">Smart Farm Gateway</h1>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 border-b pb-2 leading-none">Verified Payment</p>

                <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 mb-6 bg-gray-50/30 shadow-inner">
                    <div className="mb-6 leading-none">
                        <p className="text-[10px] text-gray-400 uppercase mb-1 tracking-widest leading-none font-black">Order ID: #{orderId}</p>
                        <p className="text-4xl font-black text-gray-900 leading-none">{formatTHB(amount)}</p>
                    </div>

                    <div className="flex justify-center bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-500/5 border border-gray-50 mb-6 transition-transform hover:scale-[1.02]">
                        {loading ? (
                            <div className="animate-spin h-10 w-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full"></div>
                        ) : qrRawData ? (
                            <QRCodeCanvas value={qrRawData} size={200} />
                        ) : (
                            <p className="text-xs text-gray-300 font-black italic uppercase leading-none">Initializing...</p>
                        )}
                    </div>

                    <div className="mt-4 leading-none font-black">
                        <label className={`block w-full py-5 px-4 rounded-[1.5rem] text-[10px] font-black uppercase cursor-pointer transition-all shadow-xl active:scale-95 leading-none
                            ${uploading ? 'bg-gray-100 text-gray-400 cursor-wait' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}>
                            {uploading ? '⚙️ AI Verifying...' : '📸 ยืนยันการโอน (แนบสลิป)'}
                            <input id="slip-upload-input" type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading || loading} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {statusModal.show && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center">
                        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-black ${statusModal.success ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                            {statusModal.success ? '✓' : '✕'}
                        </div>
                        <h2 className={`text-xl font-black mb-2 ${statusModal.success ? 'text-emerald-900' : 'text-red-900'}`}>{statusModal.message}</h2>
                        <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-8 leading-relaxed font-black">{statusModal.details}</p>
                        <button 
                            onClick={statusModal.success ? () => navigate(`/receipt/${orderId}`) : () => setStatusModal({...statusModal, show: false})} 
                            className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest ${statusModal.success ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-gray-900 text-white shadow-gray-300'}`}
                        >
                            {statusModal.success ? 'ดูใบเสร็จรับเงิน' : 'ลองใหม่'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
