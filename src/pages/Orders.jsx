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

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

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

  if (authLoading) return <div className="p-20 text-center animate-pulse font-bold text-emerald-600">กำลังตรวจสอบสิทธิ์...</div>;
  if (!user) return <Navigate to="/register" replace />;
  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-emerald-600">กำลังโหลดข้อมูล...</div>;

  if (orders.length === 0) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-7xl mb-6">🥗</div>
        <h2 className="text-xl font-bold mb-4">ยังไม่มีประวัติการสั่งซื้อ</h2>
        <Link to="/products" className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold">ไปช้อปเลย</Link>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-10 min-h-screen">
      <h1 className="text-xl font-black mb-8 text-gray-800 uppercase tracking-tight">📜 คำสั่งซื้อของฉัน</h1>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div 
              className="p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-lg">
                  {order.status === 'completed' || order.status === 'shipped' || order.status === 'finished' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳'}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-sm">#{order.orderId || order.id.slice(0, 8)}</h3>
                  <p className="text-[10px] text-gray-400 font-bold">
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'Loading...'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 ml-auto">
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">ยอดสุทธิ</p>
                  <p className="font-black text-emerald-600 text-base">{formatTHB(order.total)}</p>
                </div>
                
                <div className="flex flex-col items-end gap-1.5">
                  <div className="px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[8px] font-black text-emerald-600 uppercase">
                      {order.paymentMethod || 'PROMPTPAY'}
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-tight ${
                    order.status === 'completed' || order.status === 'shipped' || order.status === 'finished' ? 'bg-emerald-100 text-emerald-600' : 
                    order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {order.status === 'completed' || order.status === 'shipped' || order.status === 'finished' ? 'เสร็จสิ้นแล้ว' : 
                     order.status === 'paid' ? 'ชำระเงินแล้ว' :
                     order.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'รอดำเนินการ'}
                  </span>
                </div>
              </div>
            </div>

            {/* ส่วนกางรายละเอียดสินค้า */}
            {expandedId === order.id && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 bg-gray-50/20">
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">รายการสินค้า</h4>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img src={item.image || 'https://placehold.co/50'} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <div className="flex-1">
                        <p className="font-bold text-xs text-gray-800">{item.name}</p>
                        <p className="text-[10px] text-gray-500">{formatTHB(item.price)} x {item.qty}</p>
                      </div>
                      <p className="font-black text-xs text-gray-700">{formatTHB(item.price * item.qty)}</p>
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
