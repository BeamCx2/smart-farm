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
    <section className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>📜 คำสั่งซื้อของฉัน</span>
        <span className="text-sm font-normal text-gray-400">({orders.length} รายการ)</span>
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-all hover:border-emerald-200"
          >
            {/* 🔝 ส่วนหัว (ที่โชว์ในรูปของบอส) */}
            <div 
              className="p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div>
                <h3 className="font-bold text-emerald-700 dark:text-emerald-400">#{order.orderId}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {order.createdAt?.toDate().toLocaleString('th-TH')}
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ยอดสุทธิ</p>
                  <p className="font-black text-emerald-600">{formatTHB(order.total)}</p>
                </div>
                
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  order.status === 'paid' 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-amber-100 text-amber-600'
                }`}>
                  {order.status === 'paid' ? 'ชำระแล้ว' : 'รอดำเนินการ'}
                </span>

                {/* ลูกศรชี้ลง/ขึ้น */}
                <span className={`text-gray-300 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </div>

            {/* 📂 ส่วนรายละเอียดสินค้า (จะแสดงเมื่อกดคลิก) */}
            {expandedId === order.id && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 animate-in slide-in-from-top-2 duration-300">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">รายการสินค้า</h4>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <img 
                        src={item.image || 'https://placehold.co/100x100?text=ผัก'} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-white shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">จำนวน: {item.qty} ชิ้น</p>
                      </div>
                      <p className="font-bold text-sm">{formatTHB(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>

                {/* ข้อมูลจัดส่ง */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">ที่อยู่จัดส่ง</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {order.customer?.name} ({order.customer?.phone})<br />
                    {order.customer?.address} {order.customer?.district} {order.customer?.province} {order.customer?.zipcode}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
