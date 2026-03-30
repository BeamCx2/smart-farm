import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';

// --- 📦 Import Contexts ---
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';

// --- 🏗️ Import Layouts ---
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// --- 📄 Import Pages (Customer) ---
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';

// ✅ Import หน้า Payment และ Receipt
import Payment from './pages/Payment'; 
import Receipt from './pages/Receipt'; // 👈 บอสอย่าลืมสร้างไฟล์ Receipt.jsx นะครับ

// --- 👑 Import Pages (Admin) ---
import Dashboard from './pages/admin/Dashboard';
import ProductManager from './pages/admin/ProductManager';
import OrderManager from './pages/admin/OrderManager';

// --- 🛡️ Component เฝ้าประตู (ProtectedRoute) ---
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/register" replace />;
  }
  
  return children;
}

// --- 🚀 Main App Component ---
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Routes>
                {/* 🏠 Main Layout Wrapper */}
                <Route element={<Layout />}>
                  
                  {/* 🔓 หน้าที่ใครก็เข้าดูได้ (Public) */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />

                  {/* 🔒 หน้าที่ต้องล็อกอินเท่านั้น (Private) */}
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  
                  {/* ✅ เส้นทางจ่ายเงิน */}
                  <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />

                  {/* ✅ 📍 เส้นทางใบเสร็จ (รับ orderId มาโชว์ข้อมูล) */}
                  <Route path="/receipt/:orderId" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />

                  {/* 👑 Admin Zone (Private) */}
                  <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="orders" element={<OrderManager />} />
                  </Route>

                  {/* 🚫 404 - Redirect to Home */}
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
