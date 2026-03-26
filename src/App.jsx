// ... (Import อื่นๆ ของบอสคงเดิม) ...
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';

// ✅ 1. Import ไฟล์ payment ใหม่ที่บอสสร้างไว้
import Payment from './pages/payment'; 

import Dashboard from './pages/admin/Dashboard';
import ProductManager from './pages/admin/ProductManager';
import OrderManager from './pages/admin/OrderManager';

// --- 🛡️ Component เฝ้าประตู ---
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-emerald-600">กำลังตรวจสอบสิทธิ์...</div>;
  if (!user) return <Navigate to="/register" replace />;
  return children;
}

// ❌ บอสลบฟังก์ชัน PaymentComponent { ... } ตัวเดิมออกได้เลยครับ เพราะเราแยกไปไว้ในไฟล์ pages/payment.jsx แล้ว

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Routes>
                <Route element={<Layout />}>
                  
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />

                  {/* Private Routes */}
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  
                  {/* ✅ 2. เปลี่ยนจาก test-payment เป็น payment */}
                  <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                  
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />

                  {/* Admin Zone */}
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
