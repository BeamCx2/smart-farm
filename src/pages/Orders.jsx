import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB } from '../lib/utils';
import { Link, Navigate, useNavigate } from 'react-router-dom';

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!user) return;

    // ดึงข้อมูล Real-time
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // เรียงลำดับ ใหม่ไปเก่า
      const sortedOrders = orderData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setOrders(sortedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (authLoading) return <div className="p-20 text-center animate-pulse font-bold">กำลังตรวจสอบสิทธิ์...</div>;
  if (!user) return <Navigate to="/register" replace />;
  if (loading) return <div className="p-20 text-center animate-pulse font-bold">กำลังโหลดประวัติการสั่งซื้อ...</div>;

  if (orders.length === 0) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-8xl mb-6">📦</div>
        <h2 className="text-2xl font-bold mb-8">ยังไม่มีประวัติการสั่งซื้อ</h2>
        <Link to="/products" className="px-10 py-4 bg-emerald-600 text-white rounded-full font-bold shadow-lg">ไปช้อปเลย</Link>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-10 min-h-screen">
      <h1 className="text-2xl font-black mb-8 uppercase tracking-tight text-gray-800 dark:text-gray-100">📜 คำสั่งซื้อของฉัน</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div 
              className="p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl">
                  {/* ✅ ปรับ Icon ตามสถานะจริง */}
                  {order.status === 'completed' || order.status === 'shipped' || order.status === 'finished' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳'}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 dark:text-gray-100">#{order.orderId || order.id.slice(0, 8)}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'Loading...'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 ml-auto">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ยอดสุทธิ</p>
                  <p className="font-black text-emerald-600 text-lg">{formatTHB(order.total)}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {/* ✅ ปรับ Badge สีและข้อความให้ตรงกับหน้าแอดมิน */}
                  <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-tight ${
                    order.status === 'completed' || order.status === 'shipped' || order.status === 'finished' ? 'bg-emerald-100 text-emerald-600' : 
                    order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {order.status === 'completed' || order.status === 'shipped' || order.status === 'finished' ? 'เสร็จสิ้นแล้ว' : 
                     order.status === 'paid' ? 'ชำระเงินแล้ว' :
                     order.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'รอดำเนินการ'}
                  </span>

                  {order.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/test-payment', { state: { amount: order.total, orderId: order.orderId || order.id.slice(0, 8), firebaseDocId: order.id } });
                      }}
                      className="text-[10px] bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-black shadow-lg"
                    >
                      💳 ชำระเงิน
                    </button>
                  )}
                </div>
                <span className={`text-gray-300 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`}>▼</span>
              </div>
            </div>
// ... โค้ดส่วนบนคงเดิม ...

<div className="flex items-center gap-6 ml-auto">
  {/* ส่วนแสดงยอดรวม (ซ่อนในมือถือ โชว์ในคอม) */}
  <div className="text-right hidden sm:block">
    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">ยอดสุทธิ</p>
    <p className="font-black text-emerald-600 text-lg">{formatTHB(order.total)}</p>
  </div>
  
  <div className="flex flex-col items-end gap-2">
    {/* ✅ โชว์วิธีชำระเงิน (Payment Method) */}
    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">โอนผ่าน:</span>
      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase">
        {order.paymentMethod || 'PROMPTPAY'}
      </span>
    </div>

    {/* Badge สถานะสินค้า */}
    <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-tight ${
      order.status === 'completed' || order.status === 'shipped' || order.status === 'finished' ? 'bg-emerald-100 text-emerald-600' : 
      order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
      'bg-amber-100 text-amber-600'
    }`}>
      {order.status === 'completed' || order.status === 'shipped' || order.status === 'finished' ? 'เสร็จสิ้นแล้ว' : 
       order.status === 'paid' ? 'ชำระเงินแล้ว' :
       order.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'รอดำเนินการ'}
    </span>
  </div>
  
  <span className={`text-gray-300 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`}>▼</span>
</div>

// ... โค้ดส่วนล่างคงเดิม ...
            {expandedId === order.id && (
              <div className="px-8 pb-8 pt-2 border-t border-gray-50 dark:border-gray-800 bg-gray-50/20">
                <div className="py-4 space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">สรุปรายการ</h4>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-5">
                      <img src={item.image || 'https://placehold.co/100'} className="w-12 h-12 rounded-xl object-cover border" />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatTHB(item.price)} x {item.qty}</p>
                      </div>
                      <p className="font-black text-sm text-gray-700">{formatTHB(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
