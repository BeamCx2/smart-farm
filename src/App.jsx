import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import { useState } from 'react';
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

// 1. ตัด export default ออก ให้เหลือแค่ function ธรรมดา
function PaymentComponent() {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ใน App.jsx
const handlePayment = async () => {
  setLoading(true);
  console.log("--- เริ่มขั้นตอนการชำระเงิน ---");
  
  try {
    // 1. ดึง Token
    const tokenRes = await fetch('/.netlify/functions/get-kbank-token');
    const tokenData = await tokenRes.json();
    
    // ดูของจริงที่ส่งกลับมาจาก Function ใน Console
    console.log("Raw Token Data:", tokenData);

    // ถ้า KBank ส่ง Error มาในรูปแบบอื่น (เช่น data.error) เราจะดักตรงนี้
    const token = tokenData.access_token; 
    
    if (!token) {
      // ถ้าไม่มี token ให้เอา error message จาก KBank มาโชว์
      const errorMsg = tokenData.message || tokenData.error || "ไม่ได้รับ Access Token จากระบบ";
      throw new Error(errorMsg);
    }

    console.log("ดึง Token สำเร็จ:", token);

    // 2. สร้าง QR
    const qrRes = await fetch('/.netlify/functions/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: token,
        amount: 1.0 // ส่งเป็นตัวเลข
      })
    });
    
    const qrResult = await qrRes.json();
    console.log("QR Result จาก KBank:", qrResult);

    // เช็คค่าที่ KBank Sandbox มักจะส่งมา (qrImage หรือ rawQr)
    if (qrResult.qrImage || qrResult.rawQr) {
      setQrData(qrResult);
    } else {
      throw new Error(qrResult.message || "KBank ปฏิเสธการสร้าง QR");
    }
    
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error.message);
    alert(`การเชื่อมต่อขัดข้อง: ${error.message}`);
  } finally {
    setLoading(false);
    console.log("--- จบขั้นตอนการทำงาน ---");
  }
};

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl shadow-lg m-4">
      <h2 className="text-xl font-bold mb-4 text-emerald-700">ทดสอบระบบชำระเงิน Smart Farm</h2>
      <button 
        onClick={handlePayment} 
        disabled={loading}
        className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 disabled:bg-gray-400 transition-all"
      >
        {loading ? 'กำลังสร้าง QR...' : 'ชำระเงิน 1 บาท'}
      </button>

      {qrData && (
        <div className="mt-6 flex flex-col items-center animate-fade-in">
          <p className="mb-2 font-semibold">สแกนเพื่อจ่ายเงิน (Sandbox):</p>
          {/* ตรวจสอบ key ใน response: ของ KBank มักจะเป็น qrImage หรือ rawQr */}
          <img src={`data:image/png;base64,${qrData.qrImage}`} alt="KBank QR Code" className="w-64 h-64 border-4 border-emerald-100 p-2 rounded-lg" />
          <p className="mt-2 text-sm text-gray-500">Ref: {qrData.partnerTxnUid}</p>
        </div>
      )}
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
                  
                  {/* 2. เพิ่มทางเข้าหน้าทดสอบจ่ายเงินตรงนี้ */}
                  <Route path="/test-payment" element={<PaymentComponent />} />

                  <Route path="/orders" element={<Orders />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="orders" element={<OrderManager />} />
                  </Route>

                  <Route path="*" element={
                    <div className="min-h-[60vh] flex flex-col items-center justify-center">
                      <div className="text-6xl mb-4">🔍</div>
                      <h2 className="text-2xl font-bold mb-2">ไม่พบหน้า</h2>
                      <p className="text-gray-500 mb-6">หน้าที่คุณกำลังค้นหาไม่มีอยู่</p>
                      <a href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-all">กลับหน้าแรก</a>
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
