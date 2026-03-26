import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB } from '../lib/utils';
import { Link, Navigate, useNavigate } from 'react-router-dom';

// ⏰ Component นับถอยหลังที่ซิงค์กับ Firestore Timestamp เป๊ะๆ
function OrderTimer({ createdAt }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!createdAt || !createdAt.seconds) return;

        const calculateTime = () => {
            // 1. เวลาเริ่มจาก Firebase (วินาที)
            const startTime = createdAt.seconds;
            // 2. เวลาหมดอายุ (สร้าง + 24 ชม.)
            const expiryTime = startTime + (24 * 60 * 60);
            // 3. เวลาปัจจุบันของเครื่องลูกค้า (วินาที)
            const now = Math.floor(Date.now() / 1000);
            
            const diff = expiryTime - now;

            if (diff <= 0) {
                setTimeLeft("หมดเวลาชำระเงิน");
            } else {
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                
                // Format: 23:59:59
                setTimeLeft(`${h.toString().padStart(2, '0')}ชม. ${m.toString().padStart(2, '0')}น. ${s.toString().padStart(2, '0')}ว.`);
            }
        };

        const timer = setInterval(calculateTime, 1000);
        calculateTime();
        return () => clearInterval(timer);
    }, [createdAt]);

    return <span>{timeLeft}</span>;
}

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

            // จัดเรียงตามเวลาล่าสุด
            const sortedOrders = orderData.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setOrders(sortedOrders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (authLoading) return <div className="p-20 text-center animate-pulse font-black text-emerald-600 uppercase tracking-widest">Auth Verifying...</div>;
    if (!user) return <Navigate to="/register" replace />;
    if (loading) return <div className="p-20 text-center animate-pulse font-black text-emerald-600 uppercase tracking-widest">Fetching Orders...</div>;

    if (orders.length === 0) {
        return (
            <section className="max-w-4xl mx-auto px-4 py-20 text-center">
                <div className="text-7xl mb-6">🥗</div>
                <h2 className="text-xl font-black mb-4 uppercase tracking-tighter">ไม่มีประวัติการสั่งซื้อ</h2>
                <Link to="/products" className="px-10 py-4 bg-emerald-600 text-white rounded-[2rem] font-black uppercase shadow-xl shadow-emerald-100 transition-all hover:scale-105 active:scale-95">ช้อปสินค้าเลย</Link>
            </section>
        );
    }

    return (
        <section className="max-w-4xl mx-auto px-4 py-10 min-h-screen font-sans">
            <h1 className="text-xl font-black mb-10 text-gray-800 uppercase tracking-tight flex items-center gap-3">
                <span className="bg-emerald-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm">#</span>
                คำสั่งซื้อของฉัน
            </h1>

            <div className="space-y-6">
                {orders.map((order) => {
                    const isPending = order.status === 'pending';
                    return (
                        <div key={order.id} className={`bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden shadow-sm hover:shadow-md
                            ${isPending ? 'border-amber-200 ring-4 ring-amber-50' : 'border-gray-100'}`}>
                            
                            <div className="p-6 md:p-8 flex flex-wrap items-center justify-between gap-6">
                                {/* Left Section: ID & Date */}
                                <div className="flex items-center gap-5 cursor-pointer flex-1" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                                    <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner
                                        ${isPending ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-emerald-500'}`}>
                                        {order.status === 'completed' || order.status === 'paid' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳'}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-base tracking-tight">#{order.orderId || order.id.slice(0, 8)}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'Syncing...'}
                                        </p>
                                        
                                        {isPending && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                                    เหลือเวลาชำระ: <OrderTimer createdAt={order.createdAt} />
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Section: Price & Actions */}
                                <div className="flex items-center gap-6">
                                    <div className="text-right border-r border-gray-100 pr-6 hidden sm:block">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">ยอดสุทธิ</p>
                                        <p className="font-black text-gray-900 text-xl leading-none">{formatTHB(order.total)}</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border
                                            ${isPending ? 'bg-amber-100 text-amber-600 border-amber-200' : 
                                              order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                                              'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {order.status === 'paid' ? 'ชำระเงินแล้ว' : order.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'รอดำเนินการ'}
                                        </span>

                                        {isPending && (
                                            <button
                                                onClick={() => navigate('/payment', { state: { amount: order.total, orderId: order.orderId } })}
                                                className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
                                            >
                                                ชำระเงินทันที 💳
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details: Product Items */}
                            {(expandedId === order.id || isPending) && (
                                <div className="px-8 pb-8 pt-4 bg-gray-50/40 border-t border-gray-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Details</h4>
                                            <div className="h-px flex-1 mx-4 bg-gray-100"></div>
                                        </div>
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-gray-50 shadow-sm">
                                                <img src={item.image} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
                                                <div className="flex-1">
                                                    <p className="font-black text-xs text-gray-800 tracking-tight">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{formatTHB(item.price)} × {item.qty}</p>
                                                </div>
                                                <p className="font-black text-sm text-emerald-600">{formatTHB(item.price * item.qty)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
