import { useState, useEffect, useCallback } from 'react';
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

    const loadOrders = useCallback(async () => {
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
    }, [user]);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 120 * 1000);
        return () => clearInterval(interval);
    }, [loadOrders]);

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

    // eslint-disable-next-line react-hooks/purity
    const now = Math.floor(Date.now() / 1000);

    // Check for expired pending orders
    orders.forEach(order => {
        const isPending = order.status === 'pending';
        const isExpired = isPending && order.createdAt?.seconds && now > (order.createdAt.seconds + 86400);
        if (isExpired) handleSyncAutoCancel(order.id);
    });

    return (
        <section className="max-w-6xl mx-auto px-4 py-12 min-h-screen font-sans font-black transition-colors duration-300 bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Header - Professional Luxury Design */}
            <div className="mb-12 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-gray-900 dark:to-emerald-900 border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg p-8 backdrop-blur-sm">
                <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg">
                        📦
                    </div>
                    <div>
                        <h1 className="text-4xl font-black mb-2 text-emerald-600 dark:text-emerald-300 tracking-tight">คำสั่งซื้อของฉัน</h1>
                        <p className="text-sm text-emerald-600/70 dark:text-emerald-300/60 max-w-2xl">ติดตามสถานะคำสั่งซื้อของคุณได้ในที่เดียว ดูรายละเอียด ราคา และการจัดส่งได้ทันที</p>
                    </div>
                </div>
            </div>

            <div className="space-y-5 font-black">
                {orders.map((order) => {
                    const statusCfg = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                    const isPending = order.status === 'pending';
                    const isExpired = isPending && order.createdAt?.seconds && now > (order.createdAt.seconds + 86400);

                    return (
                        <div key={order.id}
                            className={`bg-white dark:bg-gray-800 rounded-2xl border-2 p-6 flex flex-col gap-5 shadow-md hover:shadow-xl transition-all group cursor-pointer
                                ${isPending ? 'border-amber-400/40 dark:border-amber-600/40 bg-gradient-to-r from-white to-amber-50/30 dark:from-gray-800 dark:to-amber-950/20' : 'border-gray-200 dark:border-gray-700'}`}
                            onClick={() => setViewOrder(order)}>

                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 dark:from-emerald-900/40 dark:to-emerald-700/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">
                                        {order.status === 'shipped' ? '🚚' : order.status === 'paid' ? '💳' : order.status === 'finished' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-2">
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wide">#{order.orderId || order.id.slice(0, 8)}</h3>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap
                                                ${statusCfg.color === 'green' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                                    statusCfg.color === 'yellow' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                                                        statusCfg.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                                                {statusCfg.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'กำลังซิงค์...'}
                                        </p>
                                        {isPending && (
                                            <div className="mt-3 inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg">
                                                <span className="text-xs text-red-700 dark:text-red-300 uppercase font-black">⏳ หมดเวลาใน:</span>
                                                <OrderTimer createdAt={order.createdAt} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">ยอดทั้งหมด</p>
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatTHB(order.total)}</p>
                                </div>
                            </div>

                            {/* Products Preview */}
                            {(order.items || []).length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 font-black">สินค้า ({order.items.length})</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-32 overflow-y-auto">
                                        {order.items.map((item, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/50'} />
                                                <div className="text-center flex-1 min-w-0">
                                                    <p className="text-xs font-black text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-black">x{item.qty}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer Row */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    <span className="font-black">{order.items?.length || 0}</span> สินค้า
                                </div>
                                {isPending && !isExpired ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePaymentRedirect(order); }}
                                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                                    >
                                        💳 ชำระเงิน
                                    </button>
                                ) : (
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                        {order.status === 'finished' ? '✅ เสร็จสิ้น' : order.status === 'cancelled' ? '❌ ยกเลิก' : 'รอดำเนินการ'}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {orders.length === 0 && !loading && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <span className="text-4xl">📭</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">ยังไม่มีออเดอร์</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">เริ่มช้อปปิ้งวันนี้และหลังจากนั้นคุณจะเห็นออเดอร์ของคุณปรากฏที่นี่</p>
                    <a href="/products" className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black rounded-lg shadow-lg transition-all hover:-translate-y-1">
                        🛍️ ไปช้อปปิ้ง
                    </a>
                </div>
            )}

            {/* Modal - Professional Luxury Design */}
            {viewOrder && (
                <div className="fixed inset-0 z-[1000] bg-black/40 dark:bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl dark:shadow-2xl dark:shadow-black/50 relative font-black border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setViewOrder(null)}
                            className="absolute top-6 right-6 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all hover:scale-110">
                            ✕
                        </button>

                        <div className="mb-6 shrink-0">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">รายละเอียดออเดอร์</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">#{viewOrder.orderId || viewOrder.id.slice(0, 8)}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-5 pr-3 custom-scrollbar">
                            {/* Tracking Info */}
                            {viewOrder.status === 'shipped' && viewOrder.trackingNumber && (
                                <div className="p-5 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-2xl text-white shadow-lg">
                                    <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">📍 Tracking ID</p>
                                    <p className="text-lg font-black tracking-widest select-all">{viewOrder.trackingNumber}</p>
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 font-black">สถานะ</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-black text-gray-900 dark:text-white">{ORDER_STATUSES[viewOrder.status]?.label || 'ไม่ทราบสถานะ'}</span>
                                    <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide
                                        ${ORDER_STATUSES[viewOrder.status]?.color === 'green' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                            ORDER_STATUSES[viewOrder.status]?.color === 'yellow' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                                                ORDER_STATUSES[viewOrder.status]?.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                                        {ORDER_STATUSES[viewOrder.status]?.label || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 font-black">📍 ที่อยู่จัดส่ง</p>
                                <div className="space-y-2">
                                    <p className="text-gray-900 dark:text-white font-black text-sm">{viewOrder.customer?.name}</p>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-black text-sm">📞 {viewOrder.customer?.phone}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {viewOrder.customer?.address}<br />
                                        {viewOrder.customer?.subDistrict} {viewOrder.customer?.district}<br />
                                        {viewOrder.customer?.province} {viewOrder.customer?.zipcode}
                                    </p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 font-black">📦 สินค้า</p>
                                <div className="space-y-2">
                                    {(viewOrder.items || []).map((item, i) => (
                                        <div key={i} className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                                            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" onError={(e) => e.target.src = 'https://via.placeholder.com/64'} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-900 dark:text-white mb-1">{item.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-black">ราคา: ฿{item.price} × {item.qty}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatTHB(item.price * item.qty)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total Amount */}
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-700 dark:to-emerald-800 p-6 rounded-2xl text-white mt-4">
                                <p className="text-xs uppercase tracking-widest opacity-80 mb-2 font-black">ยอดรวมทั้งสิ้น</p>
                                <p className="text-3xl font-black tracking-tight">{formatTHB(viewOrder.total)}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <button
                            onClick={() => setViewOrder(null)}
                            className="w-full mt-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-black text-sm uppercase tracking-wider rounded-xl transition-all">
                            ปิด
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}