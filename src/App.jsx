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
  const firebaseDocId = location.state?.firebaseDocId; // 🆔 ID ของเอกสารใน Firebase

  // ถ้าไม่มีข้อมูลยอดเงิน ให้เด้งกลับหน้าตะกร้า
  // useEffect(() => {
  //   if (!amountToPay) {
  //     navigate('/cart');
  //   }
  // }, [amountToPay, navigate]);

  // 1. ฟังก์ชันสร้าง QR Code ผ่าน Netlify Functions
  const handlePayment = async () => {
    setLoading(true);
    try {
      const tokenRes = await fetch('/.netlify/functions/get-kbank-token');
      const tokenData = await tokenRes.json();
      const token = tokenData.access_token;

      if (!token) throw new Error("ไม่สามารถขอรหัสเข้าถึงจากธนาคารได้");

      const qrRes = await fetch('/.netlify/functions/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken: token, 
          amount: amountToPay,
          orderId: orderId 
        })
      });
      const qrResult = await qrRes.json();

      if (qrResult.qrImage || qrResult.qrCode) {
        setQrData(qrResult);
      } else {
        alert("KBank Error: " + (qrResult.message || "สร้าง QR ไม่สำเร็จ"));
      }
    } catch (error) {
      alert("ระบบขัดข้อง: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. ฟังก์ชันตรวจสอบสถานะการจ่ายเงิน และ อัปเดต Firebase
  const checkStatus = async () => {
    if (!qrData) return;
    setLoading(true);
    try {
      const tokenRes = await fetch('/.netlify/functions/get-kbank-token');
      const tokenData = await tokenRes.json();

      const res = await fetch('/.netlify/functions/check-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: tokenData.access_token,
          partnerTxnUid: qrData.partnerTxnUid
        })
      });

      const statusData = await res.json();

      // 🚨 ตรวจสอบว่าชำระเงินสำเร็จหรือไม่ (KBank Success Code = "00")
      if (statusData.statusCode === "00") {
        
        // ✅ ขั้นตอนสำคัญ: อัปเดตสถานะใน Firebase ให้เป็น 'paid'
        if (firebaseDocId) {
          try {
            const orderRef = doc(db, 'orders', firebaseDocId);
            await updateDoc(orderRef, {
              status: 'paid' // เปลี่ยนสถานะเป็นชำระเงินแล้ว
            });
            console.log("✅ Firebase updated: Order marked as PAID");
          } catch (dbErr) {
            console.error("❌ Failed to update Firebase:", dbErr.message);
          }
        }

        alert("🎉 ชำระเงินสำเร็จ! ขอบคุณที่อุดหนุนฟาร์มของเรา");
        navigate('/orders'); 
      } else {
        alert(`สถานะ: ${statusData.statusDesc || 'ยังไม่พบยอดโอน กรุณารอสักครู่แล้วลองใหม่'}`);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการตรวจสอบสถานะ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 min-h-[80vh]">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-2 text-emerald-700 dark:text-emerald-400">ชำระเงินผ่าน QR Code</h2>
        <p className="text-gray-500 text-sm mb-6">รหัสออเดอร์: #{orderId}</p>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 py-4 rounded-2xl mb-8">
          <p className="text-gray-600 dark:text-gray-300 text-sm">ยอดเงินที่ต้องชำระ</p>
          <p className="text-3xl font-black text-emerald-600">฿{amountToPay.toLocaleString()}</p>
        </div>

        {!qrData ? (
          <button 
            onClick={handlePayment} 
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg"
          >
            {loading ? 'กำลังเชื่อมต่อธนาคาร...' : '📷 สร้าง QR Code เพื่อสแกน'}
          </button>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border-4 border-emerald-500 inline-block shadow-inner">
              <img 
                src={qrData.qrImage ? `data:image/png;base64,${qrData.qrImage}` : `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrData.qrCode || '')}`} 
                alt="KBank PromptPay QR" 
                className="w-64 h-64 object-contain" 
              />
            </div>
            <p className="text-xs text-gray-400 font-mono">Ref: {qrData.partnerTxnUid}</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={checkStatus}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-md"
              >
                {loading ? 'กำลังตรวจสอบ...' : '✅ ฉันโอนเงินเรียบร้อยแล้ว'}
              </button>
              <button onClick={() => setQrData(null)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                สร้าง QR ใหม่อีกครั้ง
              </button>
            </div>
          </div>
        )}
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
                    <div className="min-h-[60vh] flex flex-col items-center justify-center">
                      <div className="text-6xl mb-4">🔍</div>
                      <h2 className="text-2xl font-bold mb-2">ไม่พบหน้า</h2>
                      <p className="text-gray-500 mb-6">หน้าที่คุณกำลังค้นหาไม่มีอยู่</p>
                      <Link to="/" className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold">กลับหน้าแรก</Link>
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
