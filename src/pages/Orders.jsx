import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB, ORDER_STATUSES } from '../lib/utils';
import { Navigate, useNavigate } from 'react-router-dom';

// ⏰ Component นับถอยหลัง (เหมือนเดิม)
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

    // 🚀 [จุดแก้ไขสำคัญ]: ฟังก์ชันจัดการปุ่มจ่ายเงิน แยกตามวิธีที่เลือกไว้
    const handlePaymentRedirect = (order) => {
        const paymentState = { 
            amount: order.total, 
            orderId: order.orderId || order.id.slice(0, 8) 
        };

        // 📍 แยกเส้นทางตาม paymentMethod ใน Firebase
        if (order.paymentMethod === 'bank') {
            // ถ้าเลือกโอนผ่านธนาคาร ให้ไปหน้า BankTransfer
            navigate('/bank-transfer', { state: paymentState });
        } else {
            // ถ้าเป็น PromptPay หรืออื่นๆ ให้ไปหน้า Payment (QR)
            navigate('/payment', { state: paymentState });
        }
    };

    if (authLoading || loading) return <div className="p-20 text-center animate-pulse font-black text-emerald-600 uppercase">Fetching Orders...</div>;
    if (!user) return <Navigate to="/register" replace />;

    return (
        <section className="max-w-4xl mx-auto px-4 py-10 min-h-screen font-sans font-black">
            <h1 className="text-xl font-black mb-10 text-gray-800 uppercase tracking-tight flex items-center gap-3">
                <span className="bg-emerald-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm">#</span>
                คำสั่งซื้อของฉัน
            </h1>

            <div className="space-y-4 font-black">
                {orders.map((order) => {
                    const statusCfg = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                    const isPending = order.status === 'pending';
                    const isExpired = isPending && Math.floor(Date.now() / 1000) > (order.createdAt?.seconds + 86400);

                    if (isExpired) handleSyncAutoCancel(order.id);
                    
                    return (
                        <div key={order.id} 
                            className={`bg-white rounded-[2.5rem] border p-7 flex flex-wrap items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all group
                                ${isPending ? 'border-amber-200 ring-2 ring-amber-50' : 'border-gray-100'}`}>
                            
                            <div className="flex items-center gap-5 flex-1 cursor-pointer font-black" onClick={() => setViewOrder(order)}>
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                                    {order.status === 'shipped' ? '🚚' : order.status === 'paid' ? '💰' : order.status === 'finished' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳'}
                                </div>
                                <div>
                                    <h3 className="text-gray-900 text-base tracking-tighter uppercase font-black">#{order.orderId || order.id.slice(0, 8)}</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'Syncing...'}
                                    </p>
                                    {isPending && (
                                        <div className="mt-2 flex items-center gap-2 bg-red-50 px-3 py-1 rounded-lg w-fit">
                                            <span className="text-[9px] text-red-400 uppercase tracking-widest leading-none">⏳ หมดเวลาใน:</span>
                                            <OrderTimer createdAt={order.createdAt} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-6 font-black">
                                <div className="text-right hidden sm:block mr-2 font-black">
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1 leading-none font-black">ยอดสุทธิ</p>
                                    <p className="text-gray-900 text-xl leading-none font-black">{formatTHB(order.total)}</p>
                                </div>
                                
                                {isPending && !isExpired ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePaymentRedirect(order); // 🚀 เรียกใช้ฟังก์ชันแยกทาง
                                        }}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
                                    >
                                        💳 จ่ายเงิน
                                    </button>
                                ) : (
                                    <span onClick={() => setViewOrder(order)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm cursor-pointer
                                        ${statusCfg.color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                          statusCfg.color === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                          statusCfg.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                        {statusCfg.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 🚀 Modal รายละเอียด (เหมือนเดิม) */}
            {viewOrder && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full max-h-[96vh] flex flex-col shadow-2xl relative font-black">
                        <button onClick={() => setViewOrder(null)} className="absolute top-6 right-6 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 font-black">✕</button>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-4 shrink-0 font-black font-black">รายละเอียดออเดอร์</h2>
                        <div className="flex-1 overflow-y-auto space-y-4 font-black">
                            {viewOrder.status === 'shipped' && viewOrder.trackingNumber && (
                                <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg font-black">
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Tracking ID</p>
                                    <p className="text-lg font-black tracking-widest select-all leading-none">{viewOrder.trackingNumber}</p>
                                </div>
                            )}
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-2 font-black">📍 Shipping Address</p>
                                <p className="text-gray-900 text-sm mb-0.5 leading-none font-black">{viewOrder.customer?.name}</p>
                                <p className="text-[10px] text-emerald-600 mb-2 leading-none font-black">📞 {viewOrder.customer?.phone}</p>
                                <div className="text-[10px] text-gray-600 font-black uppercase">
                                    <p className="mb-1 font-black">{viewOrder.customer?.address}</p>
                                    <p className="font-black">{viewOrder.customer?.subDistrict} {viewOrder.customer?.district} {viewOrder.customer?.province} {viewOrder.customer?.zipcode}</p>
                                </div>
                            </div>
                            <div className="space-y-2 font-black">
                                <p className="text-[9px] text-gray-300 uppercase tracking-widest px-1 mb-1 font-black font-black">Items</p>
                                {(viewOrder.items || []).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-50 font-black">
                                        <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                        <div className="flex-1 font-black">
                                            <p className="text-[11px] text-gray-800 uppercase leading-none font-black font-black">{item.name}</p>
                                            <p className="text-[9px] text-gray-400 font-black mt-1 uppercase font-black">฿{item.price} x {item.qty}</p>
                                        </div>
                                        <p className="text-xs text-emerald-600 font-black font-black">{formatTHB(item.price * item.qty)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center bg-gray-900 p-5 rounded-2xl text-white mt-auto font-black font-black">
                                <span className="text-[9px] uppercase tracking-widest opacity-50 font-black">Total Amount</span>
                                <span className="text-2xl tracking-tighter leading-none font-black">{formatTHB(viewOrder.total)}</span>
                            </div>
                        </div>
                        <button onClick={() => setViewOrder(null)} className="w-full mt-4 py-3 bg-gray-50 text-gray-300 font-black text-[10px] uppercase tracking-[0.3em] rounded-xl hover:text-red-500 font-black font-black">Close</button>
                    </div>
                </div>
            )}
        </section>
    );
}
