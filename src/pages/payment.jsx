import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { QRCodeCanvas } from 'qrcode.react';
import { formatTHB } from '../lib/utils';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, orderId } = location.state || { amount: 0, orderId: 'N/A' };

  const [qrRawData, setQrRawData] = useState('');
  const [loading, setLoading] = useState(false);

// ในไฟล์ payment.jsx
const functions = getFunctions(app, 'https://asia-southeast1-smart-farm-c69be.cloudfunctions.net/getSCBQR');
const getSCBQR = httpsCallable(functions, 'getSCBQR');

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const result = await getSCBQR({ amount, orderId });
      setQrRawData(result.data.qrRawData);
    } catch (error) {
      console.error("QR Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (amount > 0) handleGenerateQR();
  }, [amount]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-xl font-black mb-1 text-gray-800">ชำระเงินค่าสินค้า</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 text-emerald-600">Smart Farm Gateway</p>

        <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 mb-6">
          <div className="mb-6">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">ยอดชำระทั้งสิ้น</p>
            <p className="text-3xl font-black text-gray-800">{formatTHB(amount)}</p>
          </div>

          <div className="flex justify-center bg-white p-4 rounded-3xl shadow-sm border border-gray-50">
            {loading ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : qrRawData ? (
              <QRCodeCanvas value={qrRawData} size={200} />
            ) : (
              <p className="text-xs text-gray-400">ไม่พบข้อมูล QR</p>
            )}
          </div>
        </div>

        <p className="text-[10px] font-bold text-gray-400 px-10 leading-relaxed uppercase">
          เปิดแอปธนาคารสแกน QR Code <br/> เพื่อยืนยันคำสั่งซื้อ #{orderId}
        </p>

        <button 
          onClick={() => navigate('/orders')}
          className="mt-10 text-xs font-black text-gray-300 hover:text-emerald-600 transition-colors uppercase tracking-widest"
        >
          กลับไปหน้าออเดอร์
        </button>
      </div>
    </div>
  );
}
