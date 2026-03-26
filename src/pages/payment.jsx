import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions'; // ✅ นำเข้าตัวจัดการฟังก์ชัน
import { QRCodeCanvas } from 'qrcode.react';
import { formatTHB } from '../lib/utils';
import app from '../lib/firebase'; // ✅ ต้อง Import app มาจาก config ของบอสด้วย

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, orderId } = location.state || { amount: 0, orderId: 'N/A' };

  const [qrRawData, setQrRawData] = useState('');
  const [loading, setLoading] = useState(false);

  // 🚨 จุดสำคัญ: ต้องระบุ 'asia-southeast1' ให้ตรงกับที่ Deploy หลังบ้านครับ
  const functions = getFunctions(app, 'asia-southeast1'); 
  const getSCBQR = httpsCallable(functions, 'getSCBQR');

  const handleGenerateQR = async () => {
    // ป้องกันการยิง API ถ้าข้อมูลไม่ครบ
    if (amount <= 0 || orderId === 'N/A') return;

    setLoading(true);
    try {
      console.log("กำลังขอ QR สำหรับออเดอร์:", orderId);
      const result = await getSCBQR({ amount, orderId });
      
      if (result.data && result.data.qrRawData) {
        setQrRawData(result.data.qrRawData);
      } else {
        console.error("ธนาคารไม่ส่งข้อมูล QR กลับมาครับบอส");
      }
    } catch (error) {
      console.error("QR Error Details:", error);
      // 💡 ถ้าบอสเห็น Error ใน Console ว่า 'not-found' 
      // แสดงว่าชื่อฟังก์ชัน getSCBQR ใน Firebase Console ไม่ตรงกับที่เรียกครับ
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
        <h1 className="text-xl font-black mb-1 text-gray-800">ชำระเงินค่าสินค้า</h1>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-8">Smart Farm Gateway</p>

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
              <div className="w-[200px] h-[200px] flex items-center justify-center border border-gray-100 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-400 font-bold">⚠️ ไม่พบข้อมูล QR <br/> กรุณาลองใหม่อีกครั้ง</p>
              </div>
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
