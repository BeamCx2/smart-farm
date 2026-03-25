import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from './lib/firebase'; 
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

// --- 🛡️ Component เฝ้าประตู (ใช้เฉพาะหน้าที่ "ต้อง" ล็อกอินเท่านั้น) ---
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-emerald-600">กำลังตรวจสอบสิทธิ์...</div>;
  
  if (!user) {
    return <Navigate to="/register" replace />;
  }
  return children;
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
      setQrData({ qrImageUrl: qrUrl, partnerTxnUid: "SF-" + Date.now() });
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    if (amountToPay > 0) handleGenerateQR();
    else navigate('/cart');
  }, [amountToPay]);

  const handleConfirmPayment = async () => {
    if (!firebaseDocId) return;
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', firebaseDocId);
      await updateDoc(orderRef, { status: 'paid', paymentTime: new Date().toISOString() });
      alert("🎉 บันทึกการชำระเงินเรียบร้อย!");
      navigate('/orders');
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 min-h-[85vh]">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-black mb-2 text-emerald-700">ชำระเงิน</h2>
        <p className="text-4xl font-black text-emerald-600 mb-6">฿{amountToPay.toLocaleString()}</p>
        <div className="bg-white p-5 rounded-[2rem] border-4 border-emerald-500 inline-block mb-6">
          {loading ? <div className="animate-spin text-4xl">🌀</div> : <img src={qrData?.qrImageUrl} className="w-64 h-64" />}
        </div>
        <button onClick={handleConfirmPayment} disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold uppercase shadow-lg">ยืนยันการโอนเงิน</button>
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
                  
                  {/* ✅ หน้าที่เปิดให้ "ใครก็ได้" เข้าดูได้ (Public) */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />

                  {/* 🔒 หน้าที่ "ต้องล็อกอิน" ถึงจะเข้าได้ (Private) */}
                  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/test-payment" element={<ProtectedRoute><PaymentComponent /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />

                  {/* Admin */}
                  <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="orders" element={<OrderManager />} />
                  </Route>

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
