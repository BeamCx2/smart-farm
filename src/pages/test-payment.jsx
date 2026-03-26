import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { QRCodeCanvas } from 'qrcode.react';
import { formatTHB } from '../lib/utils';

export default function TestPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, orderId } = location.state || { amount: 0, orderId: 'N/A' };

  const [qrRawData, setQrRawData] = useState('');
  const [loading, setLoading] = useState(false);

  const functions = getFunctions();
  const getSCBQR = httpsCallable(functions, 'getSCBQR');

  // ฟังก์ชันเรียกขอ QR จาก SCB ผ่าน Firebase Functions
  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const result = await getSCBQR({ 
        amount: amount, 
        orderId: orderId 
      });
      setQrRawData(result.data.qrRawData);
    } catch (error) {
      console.error("สร้าง QR ไม่ได้:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง QR Code กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  // สร้าง QR อัตโนมัติเมื่อเข้าหน้านี้
  useEffect(() => {
    if (amount > 0) {
      handleGenerateQR();
    }
  }, [amount]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-8 text-center border border-gray-100">
        <h1 className="text-2xl font-black text-gray-800 mb-2 uppercase italic">Payment Center</h1>
        <p className="text-gray-400 font-bold text-xs tracking-widest mb-8">SCB SMART PAYMENT GATEWAY</p>

        <div className="bg-emerald-50 rounded-3xl p-6 mb-8">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter mb-1">ยอดชำระสุทธิ</p>
          <p className="text-3xl font-black text-emerald-700">{formatTHB(amount)}</p>
          <p className="text-[10px] font-bold text-emerald-500 mt-2 opacity-60">ORDER ID: #{orderId}</p>
        </div>

        <div className="flex justify-center mb-8">
          {loading ? (
            <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-xs font-bold text-gray-400">กำลังขอ QR Code จากธนาคาร...</p>
            </div>
          ) : qrRawData ? (
            <div className="p-4 bg-white border-2 border-emerald-100 rounded-[2rem] shadow-inner">
              <QRCodeCanvas value={qrRawData} size={220} />
            </div>
          ) : (
            <button 
              onClick={handleGenerateQR}
              className="w-64 h-64 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:bg-emerald-50 transition-colors"
            >
              <span className="text-4xl mb-2">🔄</span>
              <p className="text-xs font-bold text-gray-400">คลิกเพื่อสร้าง QR Code ใหม่</p>
            </button>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase leading-relaxed">
            สแกนด้วยแอปธนาคารใดก็ได้ <br/> ยอดเงินจะถูกยืนยันเข้าระบบโดยอัตโนมัติ
          </p>
          
          <button 
            onClick={() => navigate('/orders')}
            className="w-full py-4 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
          >
            ยกเลิกและกลับไปหน้าออเดอร์
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 opacity-30">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Secure Sandbox Environment</p>
      </div>
    </div>
  );
}
