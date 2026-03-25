import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from './lib/firebase'; 

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext'; // ✅ แก้ไขให้เหลืออันเดียวและ Path ถูกต้อง
import { ToastProvider } from './contexts/ToastContext';

// Components & Layouts
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ProductManager from './pages/admin/ProductManager';
import OrderManager from './pages/admin/OrderManager';

// --- 🚨 ฟังก์ชันคัดกรองหน้าแรก (Root Redirect) ---
function RootRedirect() {
  const { user, loading } = useAuth();

  // ระหว่างรอเช็คสถานะล็อกอิน ไม่ต้องแสดงอะไร
  if (loading) return null;

  // ✅ ถ้าล็อกอินแล้วไปหน้าสินค้า (หรือเปลี่ยนเป็น /home ตามชอบครับ)
  // ❌ ถ้ายังไม่ล็อกอิน ดีดไปหน้า Register ทันทีตามที่บอสต้องการ
  return user ? <Navigate to="/products" replace /> : <Navigate to="/register" replace />;
}

// --- ฟังก์ชันสำหรับหน้าชำระเงิน (PaymentComponent) ---
function PaymentComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);

  const amountToPay = location.state?.amount || 0;
  const orderId = location.state?.orderId || 'N/A';
  const firebaseDocId = location.state?.firebaseDocId;

  const handleGenerateQR = () => {
    setLoading(true);
    const myPromptPayNumber = "0812345678"; 
    const qrUrl = `https://promptpay.io/${myPromptPayNumber}/${amountToPay}.png`;

    setTimeout(() => {
      setQrData({
        qrImageUrl: qrUrl,
        partnerTxnUid: "SF-" + Date.now()
      });
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    if (amountToPay > 0) {
      handleGenerateQR();
    } else {
      navigate('/cart');
    }
  }, [amountToPay]);

  const handleConfirmPayment = async () => {
    if (!firebaseDocId) return;
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', firebaseDocId);
      await updateDoc(orderRef, {
        status: 'paid',
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
        <h2 className="text-2xl font-black mb-2 text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">ชำระเงินออเดอร์</h2>
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
              <img src={qrData?.qrImageUrl} alt="PromptPay QR Code" className="w-64 h-64 object-contain rounded-lg" />
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mb-8 uppercase tracking-widest font-bold">สแกนด้วยแอปธนาคารทุกสาขา</p>
        <button onClick={handleConfirmPayment} disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50">
          {loading ? 'กำลังบันทึก...' : '✅ ฉันโอนเงินเรียบร้อยแล้ว'}
        </button>
        <button onClick={() => navigate('/orders')} className="mt-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">ชำระเงินภายหลัง</button>
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
                  
                  {/* 🚨 หน้าแรกสุดให้วิ่งไปเช็คที่ RootRedirect */}
                  <Route path="/" element={<RootRedirect />} />
                  
                  <Route path="/home" element={<Home />} />
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

                  {/* 404 Page - ดีดกลับไปหน้าแรก */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
