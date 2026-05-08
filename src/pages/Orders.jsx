import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB, ORDER_STATUSES } from '../lib/utils';
import { Navigate, useNavigate } from 'react-router-dom';

// ⏰ Component นับถอยหลัง (คงเดิม)
function OrderTimer({ createdAt }) {
    const [timeLeft, setTimeLeft] = useState("");
    useEffect(() => {
        if (!createdAt || !createdAt.seconds) return;
        const calculateTime = () => {
            const expiryTime = createdAt.seconds + (24 * 60 * 60); 
            const now = Math.floor(Date.now() / 1000);
            const diff = expiryTime - now;
            if (diff <= 0) {
                setTimeLeft("ยกเลิกออเดอร์แล้ว");
            } else {
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                setTimeLeft(`${h}ชม. ${m}น. ${s}ว.`);
            }
        };
        const timer = setInterval(calculateTime, 1000);
        calculateTime();
        return () => clearInterval(timer);
    }, [createdAt]);
    return <span className="font-black text-red-600">{timeLeft}</span>;
}

export default function Orders() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewOrder, setViewOrder] = useState(null);

    const handleSyncAutoCancel = async (orderId) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), {
                status: 'cancelled',
                cancelledAt: serverTimestamp()
            });
        } catch (error) { console.error("Auto-cancel failed:", error); }
    };

    const loadOrders = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'orders'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(100)
            );
            const snapshot = await getDocs(q);
            const orderData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(orderData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 30 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    const handlePaymentRedirect = (order) => {
        const paymentState = { 
            amount: order.total, 
            orderId: order.orderId || order.id.slice(0, 8) 
        };
        if (order.paymentMethod === 'bank') {
            navigate('/bank-transfer', { state: paymentState });
        } else {
            navigate('/payment', { state: paymentState });
        }
    };

    if (authLoading || loading) return <div className="p-20 text-center animate-pulse font-black text-emerald-600 uppercase">Fetching Orders...</div>;
    if (!user) return <Navigate to="/register" replace />;

    return (
        <section className="max-w-5xl mx-auto px-4 py-10 min-h-screen font-sans font-black transition-colors duration-300 bg-white dark:bg-slate-950">
            {/* Header - Sync Dark/Light Mode */}
            <div className="mb-10 rounded-[3rem] bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 shadow-xl p-8 backdrop-blur-xl">
                <h1 className="text-3xl font-black mb-3 uppercase tracking-tight flex items-center gap-3 text-emerald-600 dark:text-emerald-300">
                    <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-100 w-10 h-10 rounded-2xl flex items-center justify-center text-base">#</span>
                    คำสั่งซื้อของฉัน
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">ดูสถานะคำสั่งซื้อล่าสุดได้ที่หน้าเดียว พร้อมสรุปยอดและการแจ้งเตือนชำระเงินทันที</p>
            </div>

            <div className="space-y-4 font-black">
                {orders.map((order) => {
                    const statusCfg = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                    const isPending = order.status === 'pending';
                    const isExpired = isPending && order.createdAt?.seconds && Math.floor(Date.now() / 1000) > (order.createdAt.seconds + 86400);

                    if (isExpired) handleSyncAutoCancel(order.id);
                    
                    return (
                        <div key={order.id} 
                            className={`bg-white dark:bg-slate-900/95 rounded-[2.5rem] border p-7 flex flex-wrap items-center justify-between gap-6 shadow-sm transition-all group
                                ${isPending ? 'border-amber-500/40 ring-2 ring-amber-500/10' : 'border-slate-100 dark:border-slate-700'}`}>
                            
                            <div className="flex items-center gap-5 flex-1 cursor-pointer font-black" onClick={() => setViewOrder(order)}>
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {order.status === 'shipped' ? '🚚' : order.status === 'paid' ? '💰' : order.status === 'finished' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳'}
                                </div>
                                <div>
                                    <h3 className="text-slate-900 dark:text-white text-base tracking-tighter uppercase font-black">#{order.orderId || order.id.slice(0, 8)}</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'Syncing...'}
                                    </p>
                                    {isPending && (
                                        <div className="mt-2 flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-lg w-fit">
                                            <span className="text-[9px] text-red-600 dark:text-red-200 uppercase tracking-widest leading-none font-black">⏳ หมดเวลาใน:</span>
                                            <OrderTimer createdAt={order.createdAt} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-6 font-black">
                                <div className="text-right hidden sm:block mr-2 font-black">
                                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-black">ยอดสุทธิ</p>
                                    <p className="text-emerald-600 dark:text-emerald-300 text-xl font-black">{formatTHB(order.total)}</p>
                                </div>
                                
                                {isPending && !isExpired ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePaymentRedirect(order); }}
                                        className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-95 transition-all"
                                    >
                                        💳 จ่ายเงิน
                                    </button>
                                ) : (
                                    <span onClick={() => setViewOrder(order)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border cursor-pointer
                                        ${statusCfg.color === 'green' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-200 border-emerald-500/20' : 
                                          statusCfg.color === 'yellow' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-200 border-amber-500/20' : 
                                          statusCfg.color === 'blue' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-200 border-blue-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-200 border-red-500/20'}`}>
                                        {statusCfg.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal - Sync Dark/Light Mode */}
            {viewOrder && (
                <div className="fixed inset-0 z-[1000] bg-black/60 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl relative font-black border border-slate-200 dark:border-slate-800">
                        <button onClick={() => setViewOrder(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-red-500 transition-all">✕</button>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 shrink-0">รายละเอียดออเดอร์</h2>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 font-black custom-scrollbar pr-2">
                            {viewOrder.status === 'shipped' && viewOrder.trackingNumber && (
                                <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg font-black">
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Tracking ID</p>
                                    <p className="text-lg font-black tracking-widest select-all leading-none">{viewOrder.trackingNumber}</p>
                                </div>
                            )}

                            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-2 font-black">📍 Shipping Address</p>
                                <p className="text-slate-900 dark:text-white text-sm mb-0.5 font-black">{viewOrder.customer?.name}</p>
                                <p className="text-emerald-600 dark:text-emerald-300 mb-2 font-black">📞 {viewOrder.customer?.phone}</p>
                                <div className="text-[10px] text-slate-500 dark:text-slate-300 uppercase leading-relaxed">
                                    <p>{viewOrder.customer?.address}</p>
                                    <p>{viewOrder.customer?.subDistrict} {viewOrder.customer?.district} {viewOrder.customer?.province} {viewOrder.customer?.zipcode}</p>
                                </div>
                            </div>

                            <div className="space-y-2 font-black">
                                <p className="text-[9px] text-slate-400 uppercase tracking-widest px-1 mb-1 font-black">Items</p>
                                {(viewOrder.items || []).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-white p-2 rounded-xl border border-slate-100">
                                        <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                        <div className="flex-1">
                                            <p className="text-[11px] text-slate-800 uppercase leading-none font-black">{item.name}</p>
                                            <p className="text-[9px] text-slate-400 font-black mt-1 uppercase">฿{item.price} x {item.qty}</p>
                                        </div>
                                        <p className="text-xs text-emerald-600 font-black">{formatTHB(item.price * item.qty)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center bg-slate-900 dark:bg-slate-800 p-5 rounded-2xl text-white mt-auto">
                                <span className="text-[9px] uppercase tracking-widest opacity-60 font-black">Total Amount</span>
                                <span className="text-2xl tracking-tighter leading-none font-black">{formatTHB(viewOrder.total)}</span>
                            </div>
                        </div>
                        <button onClick={() => setViewOrder(null)} className="w-full mt-4 py-3 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-200 font-black text-[10px] uppercase tracking-[0.3em] rounded-xl hover:bg-emerald-500 hover:text-white transition-all">Close</button>
                    </div>
                </div>
            )}
        </section>
    );
}