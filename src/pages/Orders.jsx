import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB, ORDER_STATUSES } from '../lib/utils'; // 📍 Import ORDER_STATUSES มาใช้
import { Link, Navigate, useNavigate } from 'react-router-dom';

export default function Orders() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (authLoading || loading) return <div className="p-20 text-center animate-pulse font-black text-emerald-600 uppercase">Fetching Orders...</div>;
    if (!user) return <Navigate to="/register" replace />;

    return (
        <section className="max-w-4xl mx-auto px-4 py-10 min-h-screen font-sans">
            <h1 className="text-xl font-black mb-10 text-gray-800 uppercase tracking-tight flex items-center gap-3">
                <span className="bg-emerald-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm">#</span>
                คำสั่งซื้อของฉัน
            </h1>

            <div className="space-y-6">
                {orders.map((order) => {
                    // 📍 ดึง Config สถานะจากไฟล์กลาง (utils.js)
                    const statusCfg = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;

                    return (
                        <div key={order.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 md:p-8 flex flex-wrap items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-5 flex-1">
                                <div className="w-14 h-14 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-2xl shadow-inner">
                                    {order.status === 'shipped' ? '🚚' : order.status === 'paid' ? '💰' : order.status === 'finished' ? '✅' : '⏳'}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-base tracking-tight">#{order.orderId || order.id.slice(0, 8)}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'Syncing...'}
                                    </p>
                                    
                                    {/* ✨ แสดงเลขพัสดุ (ถ้ามี) */}
                                    {order.status === 'shipped' && order.trackingNumber && (
                                        <div className="mt-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 w-fit">
                                            📍 เลขพัสดุ: {order.trackingNumber}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right border-r border-gray-100 pr-6 hidden sm:block font-black text-gray-900 text-xl">{formatTHB(order.total)}</div>
                                
                                <div className="flex flex-col items-end gap-3">
                                    {/* 📍 ใช้สีและข้อความตาม statusCfg เป๊ะๆ */}
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm
                                        ${statusCfg.color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                          statusCfg.color === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                          statusCfg.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                          'bg-red-50 text-red-600 border-red-100'}`}>
                                        {statusCfg.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
