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
import { useLocation } from 'react-router-dom';
// 1. ตัด export default ออก ให้เหลือแค่ function ธรรมดา
// ... (imports เดิมของคุณ)

function PaymentComponent() {
  const location = useLocation();
  // ดึงยอดเงินที่ส่งมา ถ้าไม่มีให้ใช้ 1.00 เป็นค่าเริ่มต้น (ป้องกัน Error)
  const amountToPay = location.state?.amount || 1.00; 

  const handlePayment = async () => {
    setLoading(true);
    try {
      const tokenRes = await fetch('/.netlify/functions/get-kbank-token');
      const tokenData = await tokenRes.json();
      
      // ส่ง amountToPay ไปที่ฟังก์ชันสร้าง QR ด้วย
      const qrRes = await fetch('/.netlify/functions/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken: tokenData.access_token, 
          amount: amountToPay // 👈 ใช้ยอดเงินจริงจากตะกร้าแล้ว!
        })
      });
      
      const qrResult = await qrRes.json();
      // ... โค้ดส่วนที่เหลือเหมือนเดิม ...
    } catch (error) {
      alert("ระบบขัดข้อง: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* แก้ไขหัวข้อให้โชว์ยอดเงินจริง */}
      <button onClick={handlePayment}>
        {loading ? 'กำลังดำเนินการ...' : `สร้าง QR ${amountToPay} บาท`}
      </button>
      {/* ... */}
    </div>
  );
}

  // 2. ฟังก์ชันตรวจสอบสถานะ (Inquiry)
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
      if (statusData.statusCode === "00") {
        alert("🎉 ชำระเงินสำเร็จ!");
      } else {
        alert(`สถานะ: ${statusData.statusDesc || 'ยังไม่พบยอดเงิน'}`);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการตรวจสอบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl shadow-lg m-4">
      <h2 className="text-xl font-bold mb-6 text-emerald-700">ระบบชำระเงิน Smart Farm</h2>
      
      <button 
        onClick={handlePayment} 
        disabled={loading}
        className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md"
      >
        {loading ? 'กำลังดำเนินการ...' : 'สร้าง QR 1 บาท'}
      </button>

      {qrData && (
        <div className="mt-8 flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <p className="mb-3 font-semibold text-emerald-800 underline decoration-emerald-200 decoration-4">สแกนชำระเงิน</p>
          <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-xl">
            
            {/* 🚨 ส่วนที่เปลี่ยน: เช็คว่า KBank ส่งไฟล์ภาพ หรือส่งมาแค่ข้อความ 🚨 */}
            {qrData.qrImage ? (
              <img 
                src={`data:image/png;base64,${qrData.qrImage}`} 
                alt="QR Code" 
                className="w-64 h-64 object-contain" 
              />
            ) : (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrData.qrCode || '')}`} 
                alt="Thai QR Code" 
                className="w-64 h-64 object-contain" 
              />
            )}
            {/* 🚨 จบส่วนที่เปลี่ยน 🚨 */}

          </div>
          <p className="mt-4 text-xs text-gray-400 font-mono">Ref: {qrData.partnerTxnUid}</p>

          <button 
            onClick={checkStatus}
            disabled={loading}
            className="mt-6 px-8 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-full font-bold hover:bg-emerald-50 disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'ฉันชำระเงินเรียบร้อยแล้ว'}
          </button>
        </div>
      )}
    </div>
  );
} // ปิดฟังก์ชัน PaymentComponent (ตัวเดียวพอครับ!)

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
