import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB } from '../lib/utils';
import { Link, Navigate } from 'react-router-dom'; // 🚨 เพิ่ม Navigate ตรงนี้ด้วย

export default function Orders() {
  const { user, loading: authLoading } = useAuth(); // 🚨 ดึง loading ของ auth มาด้วย
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // 🚨 1. ถ้า Auth กำลังโหลด ให้โชว์ Loading ก่อน
  if (authLoading) {
    return <div className="p-20 text-center text-emerald-600 animate-pulse font-bold">กำลังตรวจสอบสิทธิ์...</div>;
  }

  // 🚨 2. ถ้าไม่มี User (ไม่ได้ล็อกอิน) ให้ดีดไปหน้าสมัครสมาชิกทันที
  if (!user) {
    return <Navigate to="/register" replace />;
  }

  // ... โค้ด useEffect และ logic อื่นๆ ของเดิมของบอส ...

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (loading) return <div className="p-20 text-center text-emerald-600 animate-pulse font-bold">กำลังโหลดประวัติการสั่งซื้อ...</div>;

  // ✅ ย้ายมาไว้ตรงนี้ (หลัง loading และต้องอยู่ในฟังก์ชัน Orders)
  if (orders.length === 0) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-8xl mb-6">📦</div>
        <h2 className="text-2xl font-bold mb-2">ยังไม่มีประวัติการสั่งซื้อ</h2>
        <p className="text-gray-500 mb-8">เริ่มสั่งซื้อสินค้าสดๆ จากฟาร์มของเราได้เลยตอนนี้</p>
        <Link to="/products" className="inline-block px-10 py-4 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
          ไปช้อปเลย
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-10 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <span>📜 คำสั่งซื้อของฉัน</span>
        <span className="text-sm font-medium px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
          {orders.length} รายการ
        </span>
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className={`bg-white dark:bg-gray-900 rounded-[2rem] border transition-all duration-300 overflow-hidden ${
              expandedId === order.id 
              ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' 
              : 'border-gray-100 dark:border-gray-800 hover:border-emerald-200 shadow-sm'
            }`}
          >
            {/* Header */}
            <div 
              className="p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-xl">
                  {order.status === 'paid' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">#{order.orderId || order.id.slice(0, 8)}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'Loading...'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 ml-auto">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">ยอดสุทธิ</p>
                  <p className="font-black text-emerald-600 text-lg">{formatTHB(order.total)}</p>
                </div>
                
                <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-tight ${
                  order.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 
                  order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
                  'bg-amber-100 text-amber-600'
                }`}>
                  {order.status === 'paid' ? 'ชำระแล้ว' : 
                   order.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'รอดำเนินการ'}
                </span>

                <span className={`text-gray-300 transition-transform duration-300 ${expandedId === order.id ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </div>

            {/* Content (Accordion) */}
            {expandedId === order.id && (
              <div className="px-8 pb-8 pt-2 border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 animate-in fade-in slide-in-from-top-3">
                <div className="py-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-[0.2em]">สรุปรายการสินค้า</h4>
                  <div className="space-y-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden shrink-0 border border-gray-100 shadow-sm p-1">
                          <img 
                            src={item.image || 'https://placehold.co/100x100?text=PRODUCT'} 
                            alt={item.name} 
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 font-medium">{formatTHB(item.price)} x {item.qty}</p>
                        </div>
                        <p className="font-black text-sm text-gray-700 dark:text-gray-200">{formatTHB(item.price * item.qty)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 pt-6 border-t border-gray-200/60 dark:border-gray-700/60 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-5 rounded-3xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-[0.2em]">จัดส่งที่</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      <span className="text-gray-900 dark:text-white font-bold">{order.customer?.name}</span> <span className="text-xs text-gray-400">({order.customer?.phone})</span><br />
                      {order.customer?.address} {order.customer?.district}<br />
                      {order.customer?.province} {order.customer?.zipcode}
                    </p>
                  </div>
                  <div className="flex flex-col justify-end items-end space-y-1">
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">การชำระเงิน</p>
                     <p className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase">{order.paymentMethod || 'PromptPay'}</p>
                     <div className="pt-2 sm:hidden text-right w-full">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">ยอดรวมทั้งสิ้น</p>
                        <p className="font-black text-emerald-600 text-xl">{formatTHB(order.total)}</p>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
