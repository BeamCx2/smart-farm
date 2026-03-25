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

function PaymentComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);

  const amountToPay = location.state?.amount || 0;
  const orderId = location.state?.orderId || 'N/A';
  const firebaseDocId = location.state?.firebaseDocId;

  // 🚨 ลบ useEffect ที่เคยสั่ง navigate('/cart') ออกไปแล้วเพื่อให้หน้าไม่เด้งกลับ 🚨

  const handlePayment = async () => {
    setLoading(true);
    try {
      const tokenRes = await fetch('/.netlify/functions/get-kbank-token');
      const tokenData = await tokenRes.json();
      const token = tokenData.access_token;
      if (!token) throw new Error("Token Error");

      const qrRes = await fetch('/.netlify/functions/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, amount: amountToPay, orderId: orderId })
      });
      const qrResult = await qrRes.json();
      if (qrResult.qrImage || qrResult.qrCode) { setQrData(qrResult); }
    } catch (error) { alert("ระบบขัดข้อง: " + error.message); } finally { setLoading(false); }
  };

  const checkStatus = async () => {
    if (!qrData) return;
    setLoading(true);
    try {
      const tokenRes = await fetch('/.netlify/functions/get-kbank-token');
      const tokenData = await tokenRes.json();
      const res = await fetch('/.netlify/functions/check-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokenData.access_token, partnerTxnUid: qrData.partnerTxnUid })
      });
      const statusData = await res.json();
      if (statusData.statusCode === "00") {
        if (firebaseDocId) {
          await updateDoc(doc(db, 'orders', firebaseDocId), { status: 'paid' });
        }
        alert("🎉 ชำระเงินสำเร็จ!");
        navigate('/orders'); 
      } else { alert(`สถานะ: ${statusData.statusDesc || 'ยังไม่พบยอดเงิน'}`); }
    } catch (error) { alert("เกิดข้อผิดพลาด"); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[80vh] bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700">ชำระเงินออเดอร์ #{orderId}</h2>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 py-6 rounded-2xl mb-8">
          <p className="text-sm text-gray-500 mb-1">ยอดเงินที่ต้องชำระ</p>
          <p className="text-3xl font-black text-emerald-600">฿{amountToPay.toLocaleString()}</p>
        </div>
        {!qrData ? (
          <button onClick={handlePayment} disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'กำลังเชื่อมต่อธนาคาร...' : '📷 สร้าง QR Code'}
          </button>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-4 rounded-2xl border-4 border-emerald-500 inline-block">
              <img src={`data:image/png;base64,${qrData.qrImage}`} alt="QR" className="w-64 h-64 object-contain" />
            </div>
            <button onClick={checkStatus} disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700">
              {loading ? 'กำลังตรวจสอบ...' : '✅ ฉันโอนเงินเรียบร้อยแล้ว'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="orders" element={<OrderManager />} />
                  </Route>
                </Route>
              </Routes>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
