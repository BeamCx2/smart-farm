import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB } from '../lib/utils';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null); // 🚨 สำหรับเก็บว่ากำลังเปิดดูออเดอร์ไหน

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

  if (loading) return <div className="p-20 text-center text-emerald-600 animate-pulse">กำลังโหลดประวัติการสั่งซื้อ...</div>;

  return (
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-bold mb-2">ยังไม่มีประวัติการสั่งซื้อ</h2>
        <p className="text-gray-500 mb-8">เริ่มสั่งซื้อสินค้าสดๆ จากฟาร์มของเราได้เลยตอนนี้</p>
        <Link to="/products" className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-600/20">
          ไปช้อปเลย
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>📜 คำสั่งซื้อของฉัน</span>
        <span className="text-sm font-normal text-gray-400">({orders.length} รายการ)</span>
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className={`bg-white dark:bg-gray-900 rounded-3xl border shadow-sm overflow-hidden transition-all ${
              expandedId === order.id ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-gray-100 dark:border-gray-800 hover:border-emerald-200'
            }`}
          >
            {/* Header */}
            <div 
              className="p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div>
                <h3 className="font-bold text-emerald-700 dark:text-emerald-400">#{order.orderId || order.id.slice(0, 8)}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'กำลังโหลด...'}
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ยอดสุทธิ</p>
                  <p className="font-black text-emerald-600">{formatTHB(order.total)}</p>
                </div>
                
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
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

            {/* Details (Accordion) */}
            {expandedId === order.id && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-[0.2em]">รายการสินค้า</h4>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                        <img 
                          src={item.image || 'https://placehold.co/100x100?text=ผัก'} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatTHB(item.price)} x {item.qty}</p>
                      </div>
                      <p className="font-bold text-sm">{formatTHB(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>

                {/* Shipping Info */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-[0.2em]">ที่อยู่จัดส่ง</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      <strong>{order.customer?.name}</strong> <span className="text-gray-400">({order.customer?.phone})</span><br />
                      {order.customer?.address} {order.customer?.district} {order.customer?.province} {order.customer?.zipcode}
                    </p>
                  </div>
                  <div className="sm:text-right flex flex-col sm:justify-end">
                     <p className="text-xs text-gray-400">วิธีชำระเงิน: <span className="text-gray-900 dark:text-gray-100 font-medium uppercase">{order.paymentMethod || 'PromptPay'}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
