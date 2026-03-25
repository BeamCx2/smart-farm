import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from './lib/firebase'; 
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/admin/Dashboard';
import ProductManager from './pages/admin/ProductManager';
import OrderManager from './pages/admin/OrderManager';

// --- ฟังก์ชันสำหรับหน้าชำระเงิน (PaymentComponent) ---
function PaymentComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🚨 ดึงข้อมูลที่ส่งมาจากหน้า Checkout
  const amountToPay = location.state?.amount || 0;
  const orderId = location.state?.orderId || 'N/A';
  const firebaseDocId = location.state?.firebaseDocId;

  // 1. ฟังก์ชันสร้าง QR Code (ใช้ PromptPay API สาธารณะเพื่อความชัวร์ว่ารูปไม่แตก)
  const handleGenerateQR = () => {
    setLoading(true);
    
    // บอสเปลี่ยนเลข 0812345678 เป็นเบอร์ PromptPay ของบอสได้เลยครับ
    const myPromptPayNumber = "0812345678"; 
    const qrUrl = `https://promptpay.io/${myPromptPayNumber}/${amountToPay}.png`;

    // จำลองการโหลดเล็กน้อยให้ดูเหมือนระบบธนาคารทำงาน
    setTimeout(() => {
      setQrData({
        qrImageUrl: qrUrl,
        partnerTxnUid: "SF-" + Date.now()
      });
      setLoading(false);
    }, 800);
  };

  // รันสร้าง QR ทันทีที่เข้าหน้าจอ
  useEffect(() => {
    if (amountToPay > 0) {
      handleGenerateQR();
    } else {
      navigate('/cart');
    }
  }, [amountToPay]);

  // 2. ฟังก์ชันยืนยันการจ่ายเงิน (อัปเดตสถานะใน Firebase)
  const handleConfirmPayment = async () => {
    if (!firebaseDocId) return;
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', firebaseDocId);
      await updateDoc(orderRef, {
        status: 'paid', // ✅ อัปเดตเป็นชำระเงินแล้ว
        paymentTime: new Date().toISOString()
      });
      
      alert("🎉 บันทึกการชำระเงินเรียบร้อย! ขอบคุณครับ");
      navigate('/orders');
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 min-h-[85vh]">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-black mb-2 text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
          ชำระเงินออเดอร์
        </h2>
        <p className="text-gray-400 text-xs font-mono mb-6">#{orderId}</p>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 py-5 rounded-3xl mb-8 border border-emerald-100 dark:border-emerald-800">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">ยอดเงินที่ต้องชำระ</p>
          <p className="text-4xl font-black text-emerald-600">฿{amountToPay.toLocaleString()}</p>
        </div>

        <div className="relative group">
          <div className="bg-white p-5 rounded-[2rem] border-4 border-emerald-500 inline-block shadow-xl mb-6 transition-transform group-hover:scale-[1.02]">
            {loading ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : (
              <img 
                src={qrData?.qrImageUrl} 
                alt="PromptPay QR Code" 
                className="w-64 h-64 object-contain rounded-lg"
                onLoad={() => console.log("QR Loaded")}
              />
            )}
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mb-8 uppercase tracking-widest font-bold">
          สแกนด้วยแอปธนาคารทุกสาขา
        </p>
        
        <button 
          onClick={handleConfirmPayment}
          disabled={loading}
          className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'กำลังบันทึก...' : '✅ ฉันโอนเงินเรียบร้อยแล้ว'}
        </button>
        
        <button 
          onClick={() => navigate('/orders')}
          className="mt-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
        >
          ชำระเงินภายหลัง
        </button>
      </div>
    </div>
  );
}

// --- ฟังก์ชันหลักของ App ---
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/test-payment" element={<PaymentComponent />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="orders" element={<OrderManager />} />
                  </Route>

                  {/* 404 Page */}
                  <Route path="*" element={
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-10">
                      <div className="text-8xl mb-6">🏜️</div>
                      <h2 className="text-3xl font-black mb-2 uppercase">ไม่พบหน้านี้</h2>
                      <p className="text-gray-400 mb-8">หน้าที่คุณค้นหาอาจถูกย้ายหรือลบไปแล้ว</p>
                      <Link to="/" className="px-10 py-4 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">กลับหน้าแรก</Link>
                    </div>
                  } />
                </Route>
              </Routes>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
