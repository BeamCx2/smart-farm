import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions'; 
import { QRCodeCanvas } from 'qrcode.react'; // ✅ ต้องมี Library นี้ (npm install qrcode.react)
import { formatTHB } from '../lib/utils';
import app from '../lib/firebase'; 

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, orderId } = location.state || { amount: 0, orderId: 'N/A' };

  const [qrRawData, setQrRawData] = useState('');
  const [loading, setLoading] = useState(false);

  // ตั้งค่าดึง Function จาก Region สิงคโปร์
  const functions = getFunctions(app, 'asia-southeast1'); 
  const getSCBQR = httpsCallable(functions, 'getscbqr');

  const handleGenerateQR = async () => {
    if (amount <= 0 || orderId === 'N/A') return;

    setLoading(true);
    try {
      const result = await getSCBQR({ amount, orderId });
      
      if (result.data && result.data.qrRawData) {
        setQrRawData(result.data.qrRawData);
      } else {
        console.error("Data error:", result.data);
      }
    } catch (error) {
      console.error("Request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateQR();
  }, [amount, orderId]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full">
        <h1 className="text-xl font-black mb-1 text-gray-800 tracking-tighter">ชำระเงินค่าสินค้า</h1>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-8">Smart Farm Gateway</p>

        <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 mb-6 bg-gray-50/30">
          <div className="mb-6">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">ยอดชำระทั้งสิ้น</p>
            <p className="text-4xl font-black text-gray-900">{formatTHB(amount)}</p>
          </div>

          <div className="flex justify-center bg-white p-6 rounded-[2rem] shadow-xl shadow-emerald-500/5 border border-gray-50">
            {loading ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : qrRawData ? (
              <div className="p-2 bg-white">
                <QRCodeCanvas value={qrRawData} size={200} level="H" includeMargin={false} />
              </div>
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center border border-gray-100 rounded-2xl bg-gray-50">
                <p className="text-[10px] text-gray-400 font-bold uppercase">⚠️ QR Generation Failed</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] font-bold text-gray-400 px-10 leading-relaxed uppercase tracking-widest">
          เปิดแอปธนาคารสแกน QR Code <br/> เพื่อชำระเงินคืนให้ Smart Farm
        </p>

        <button 
          onClick={() => navigate('/orders')}
          className="mt-12 text-[10px] font-black text-gray-300 hover:text-emerald-600 transition-all uppercase tracking-[0.3em]"
        >
          [ กลับไปหน้าออเดอร์ ]
        </button>
      </div>
    </div>
  );
}