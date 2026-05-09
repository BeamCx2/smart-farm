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

    const scanSlipForPayload = async (file) => {
        const imageBitmap = await (window.createImageBitmap ? createImageBitmap(file) : new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }));

        const width = imageBitmap.width;
        const height = imageBitmap.height;
        const maxSide = 1024;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const targetWidth = Math.max(200, Math.round(width * scale));
        const targetHeight = Math.max(200, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const code = jsQR(imageData.data, targetWidth, targetHeight);
        imageBitmap.close?.();
        return code ? code.data : null;
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
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/40 dark:bg-emerald-500/5 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-amber-200/40 dark:bg-cyan-500/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-emerald-300/20 dark:bg-emerald-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 right-10 w-28 h-28 bg-gray-200/30 dark:bg-slate-700/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '0.5s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg dark:shadow-lg dark:shadow-emerald-900/30 animate-bounce">
                        <span className="text-3xl">💳</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                        ชำระเงิน
                    </h1>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        ยืนยันการโอนเงินผ่าน PromptPay
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl dark:shadow-black/40 border border-gray-200 dark:border-gray-700 mb-8 animate-fade-in-up">
                    {/* Order Summary */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">รหัสคำสั่งซื้อ</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-6">Order #{orderId}</p>

                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">ยอดเงินที่ต้องชำระ</p>
                        <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                            {formatTHB(amount)}
                        </p>
                    </div>

                    {/* QR Code Section */}
                    <div className="mb-8">
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-4 text-center">
                            📱 สแกน QR ด้านล่าง
                        </p>
                        <div className="flex justify-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg dark:shadow-lg dark:shadow-black/30 border-2 border-gray-300 dark:border-gray-600 transition-transform hover:scale-[1.02] duration-300">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="animate-spin h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-emerald-600 dark:border-t-emerald-400 rounded-full"></div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">กำลังสร้าง QR Code...</p>
                                </div>
                            ) : qrRawData ? (
                                <div className="flex flex-col items-center gap-3">
                                    <QRCodeCanvas value={qrRawData} size={240} level="H" includeMargin={true} />
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">PromptPay QR Code</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="text-5xl mb-2">⏳</div>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">กำลังเตรียม...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Slip Button */}
                    <div className="space-y-3">
                        <label className={`block w-full py-4 px-6 rounded-2xl font-bold text-sm uppercase tracking-widest cursor-pointer transition-all duration-300 transform active:scale-95 shadow-lg border-2
                            ${uploading
                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed border-gray-400 dark:border-gray-600'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 hover:from-emerald-600 hover:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 text-white shadow-emerald-500/40 dark:shadow-emerald-900/40 border-emerald-400 dark:border-emerald-700 hover:shadow-lg hover:-translate-y-0.5'}`}>
                            {uploading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                                    ⚙️ กำลังตรวจสอบสลิป...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    📸 ยืนยันการโอน (แนบสลิป)
                                </span>
                            )}
                            <input
                                id="slip-upload-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleUploadSlip}
                                disabled={uploading || loading}
                            />
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 text-center font-medium">
                            ✓ AI ตรวจสลิปอัตโนมัติ • ระบบตัดสต๊อกทันที
                        </p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-700/50 text-center animate-fade-in-up">
                    <p className="text-xs text-gray-700 dark:text-gray-200">
                    </p>
                </div>
            </div>

            {/* Modal */}
            {statusModal.show && (
                <div className="fixed inset-0 z-[1000] bg-black/40 dark:bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 max-w-sm w-full shadow-2xl dark:shadow-2xl dark:shadow-black/50 border border-gray-200 dark:border-gray-700 text-center animate-in zoom-in-95 duration-300">
                        <div className={`w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center text-5xl font-black transition-transform
                            ${statusModal.success
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 scale-in-95 animate-bounce'
                                : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                            {statusModal.success ? '✓' : '✕'}
                        </div>
                        <h2 className={`text-2xl font-black mb-4 leading-tight
                            ${statusModal.success
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-700 dark:text-red-400'}`}>
                            {statusModal.message}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium">
                            {statusModal.details}
                        </p>
                        <button
                            onClick={statusModal.success ? () => navigate(`/receipt/${orderId}`) : () => setStatusModal({ ...statusModal, show: false })}
                            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 transform hover:-translate-y-1 shadow-lg active:scale-95
                                ${statusModal.success
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 hover:from-emerald-600 hover:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 text-white shadow-emerald-500/40 dark:shadow-emerald-900/40'
                                    : 'bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white shadow-gray-500/30'}`}
                        >
                            {statusModal.success ? '👉 ดูใบเสร็จรับเงิน' : '🔄 ลองใหม่'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
