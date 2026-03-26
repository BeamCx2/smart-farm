import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB, ORDER_STATUSES } from '../lib/utils';
import { Link, Navigate, useNavigate } from 'react-router-dom';

export default function Orders() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewOrder, setViewOrder] = useState(null); // State สำหรับเปิด Modal ดูรายละเอียด

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orderData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(orderData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    if (authLoading || loading) return <div className="p-20 text-center animate-pulse font-black text-emerald-600 uppercase tracking-widest">Fetching Orders...</div>;
    if (!user) return <Navigate to="/register" replace />;

    return (
        <section className="max-w-4xl mx-auto px-4 py-10 min-h-screen font-sans">
            <h1 className="text-xl font-black mb-10 text-gray-800 uppercase tracking-tight flex items-center gap-3">
                <span className="bg-emerald-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black">#</span>
                คำสั่งซื้อของฉัน
            </h1>

            <div className="space-y-4">
                {orders.map((order) => {
                    const statusCfg = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                    return (
                        <div 
                            key={order.id} 
                            onClick={() => setViewOrder(order)}
                            className="bg-white rounded-[2rem] border border-gray-100 p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-emerald-100 cursor-pointer transition-all group"
                        >
                            <div className="flex items-center gap-5 flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                                    {order.status === 'shipped' ? '🚚' : order.status === 'paid' ? '💰' : order.status === 'finished' ? '✅' : '⏳'}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-base tracking-tight uppercase">#{order.orderId || order.id.slice(0, 8)}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'Syncing...'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">ยอดสุทธิ</p>
                                    <p className="font-black text-gray-900 text-lg leading-none">{formatTHB(order.total)}</p>
                                </div>
                                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm
                                    ${statusCfg.color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                      statusCfg.color === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                      statusCfg.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                    {statusCfg.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 🚀 Modal รายละเอียดออเดอร์สำหรับลูกค้า */}
            {viewOrder && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl scale-in-center custom-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">รายละเอียดคำสั่งซื้อ</h2>
                            <button onClick={() => setViewOrder(null)} className="text-2xl text-gray-300 hover:text-red-500">✕</button>
                        </div>

                        {/* ✅ ส่วนเลขพัสดุ (โชว์เมื่อจัดส่งแล้ว) */}
                        {viewOrder.status === 'shipped' && viewOrder.trackingNumber && (
                            <div className="mb-8 p-6 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-100 animate-pulse">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">สถานะ: กำลังจัดส่ง</p>
                                <p className="text-xs font-black uppercase tracking-widest mb-2">เลขพัสดุของคุณคือ</p>
                                <p className="text-2xl font-black tracking-[0.1em] select-all">{viewOrder.trackingNumber}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">📍 ที่อยู่จัดส่ง</p>
                                <p className="font-black text-gray-800 text-sm mb-1">{viewOrder.customer?.name}</p>
                                <p className="text-xs text-gray-500 font-bold leading-relaxed">{viewOrder.customer?.address}</p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">🛒 รายการสินค้า</p>
                                {viewOrder.items?.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-50 shadow-sm">
                                        <img src={item.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                        <div className="flex-1">
                                            <p className="font-black text-xs text-gray-800">{item.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{formatTHB(item.price)} x {item.qty}</p>
                                        </div>
                                        <p className="font-black text-sm text-emerald-600">{formatTHB(item.price * item.qty)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-dashed border-gray-200">
                                <div className="flex justify-between items-center bg-gray-900 p-6 rounded-[2rem] text-white shadow-xl shadow-gray-200">
                                    <span className="text-[10px] font-black uppercase tracking-widest">ยอดรวมทั้งหมด</span>
                                    <span className="text-2xl font-black">{formatTHB(viewOrder.total)}</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setViewOrder(null)}
                            className="w-full mt-8 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
