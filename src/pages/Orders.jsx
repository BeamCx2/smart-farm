import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB, ORDER_STATUSES } from '../lib/utils';
import { Navigate, useNavigate } from 'react-router-dom';

// ⏰ Component นับถอยหลัง (ซิงค์กับระบบ Cancel)
function OrderTimer({ createdAt }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!createdAt || !createdAt.seconds) return;

        const calculateTime = () => {
            const startTime = createdAt.seconds;
            const expiryTime = startTime + (24 * 60 * 60); 
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
        <section className="max-w-4xl mx-auto px-4 py-10 min-h-screen font-sans font-black">
            <h1 className="text-xl font-black mb-10 text-gray-800 uppercase tracking-tight flex items-center gap-3">
                <span className="bg-emerald-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black">#</span>
                คำสั่งซื้อของฉัน
            </h1>

            <div className="space-y-4">
                {orders.map((order) => {
                    const statusCfg = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                    const isPending = order.status === 'pending';
                    
                    return (
                        <div key={order.id} 
                            className={`bg-white rounded-[2.5rem] border p-7 flex flex-wrap items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all group relative
                                ${isPending ? 'border-amber-200 ring-2 ring-amber-50' : 'border-gray-100'}`}>
                            
                            <div className="flex items-center gap-5 flex-1 cursor-pointer font-black" onClick={() => setViewOrder(order)}>
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform font-black">
                                    {order.status === 'shipped' ? '🚚' : order.status === 'paid' ? '💰' : order.status === 'finished' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳'}
                                </div>
                                <div className="font-black">
                                    <h3 className="text-gray-900 text-base tracking-tighter uppercase font-black">#{order.orderId || order.id.slice(0, 8)}</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH') : 'Syncing...'}
                                    </p>
                                    
                                    {isPending && (
                                        <div className="mt-2 flex items-center gap-2 bg-red-50 px-3 py-1 rounded-lg w-fit">
                                            <span className="text-[9px] text-red-400 uppercase tracking-widest leading-none font-black">⏳ หมดเวลาใน:</span>
                                            <OrderTimer createdAt={order.createdAt} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-6 font-black">
                                <div className="text-right hidden sm:block font-black mr-2">
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1 leading-none font-black">ยอดสุทธิ</p>
                                    <p className="text-gray-900 text-xl leading-none font-black">{formatTHB(order.total)}</p>
                                </div>
                                
                                {isPending ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/payment', { 
                                                state: { 
                                                    amount: order.total, 
                                                    orderId: order.orderId || order.id.slice(0, 8) 
                                                } 
                                            });
                                        }}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all font-black"
                                    >
                                        💳 จ่ายเงิน
                                    </button>
                                ) : (
                                    <span onClick={() => setViewOrder(order)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm cursor-pointer font-black
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

            {/* 🚀 Modal รายละเอียด (ฉบับแก้บั๊กที่อยู่มาไม่ครบ) */}
            {viewOrder && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] p-10 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl scale-in-center font-black">
                        <div className="flex justify-between items-center mb-8 shrink-0 font-black">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter font-black">รายละเอียดออเดอร์</h2>
                            <button onClick={() => setViewOrder(null)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-inner transition-colors">✕</button>
                        </div>

                        {/* เลขพัสดุ */}
                        {viewOrder.status === 'shipped' && viewOrder.trackingNumber && (
                            <div className="mb-8 p-6 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 font-black">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 font-black">เลขพัสดุของคุณคือ</p>
                                <p className="text-2xl font-black tracking-[0.1em] select-all uppercase leading-none font-black">{viewOrder.trackingNumber}</p>
                            </div>
                        )}

                        <div className="space-y-6 font-black">
                            {/* 📍 ส่วนที่อยู่จัดส่งแบบละเอียด (Fallback Logic) */}
                            <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 font-black">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 leading-none font-black">📍 Shipping Address</p>
                                <p className="text-gray-900 text-sm mb-1 leading-none font-black">{viewOrder.customer?.name}</p>
                                <p className="text-[11px] text-emerald-600 font-black mb-2 leading-none font-black">📞 {viewOrder.customer?.phone}</p>
                                
                                <div className="text-[11px] text-gray-400 font-black leading-relaxed lowercase tracking-tight italic font-black">
                                    {/* 🏠 1. บ้านเลขที่/ซอย/ถนน */}
                                    <p className="text-gray-700 not-italic font-black mb-1">{viewOrder.customer?.address}</p>
                                    
                                    {/* 🏠 2. ตำบล/อำเภอ (ดักทั้งชื่อฟิลด์เก่าและใหม่) */}
                                    <p>
                                        ต.{viewOrder.customer?.subDistrict || viewOrder.customer?.district} 
                                        อ.{viewOrder.customer?.district || viewOrder.customer?.amphoe}
                                    </p>
                                    
                                    {/* 🏠 3. จังหวัด/รหัสไปรษณีย์ */}
                                    <p>จ.{viewOrder.customer?.province} {viewOrder.customer?.zipcode}</p>
                                </div>
                            </div>

                            <div className="space-y-3 font-black">
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest px-2 leading-none font-black">🛒 Order Items</p>
                                {(viewOrder.items || []).map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-50 shadow-sm font-black">
                                        <img src={item.image} className="w-12 h-12 rounded-2xl object-cover shadow-sm font-black" alt="" />
                                        <div className="flex-1 font-black">
                                            <p className="text-xs text-gray-800 uppercase tracking-tight leading-none font-black">{item.name}</p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase mt-1 leading-none font-black">{formatTHB(item.price)} x {item.qty}</p>
                                        </div>
                                        <p className="text-sm text-emerald-600 font-black font-black">{formatTHB(item.price * item.qty)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 font-black">
                                <div className="flex justify-between items-center bg-gray-900 p-7 rounded-[2.5rem] text-white shadow-2xl shadow-gray-200 font-black">
                                    <span className="text-[10px] uppercase tracking-widest opacity-50 font-black">Total Amount</span>
                                    <span className="text-3xl tracking-tighter leading-none font-black">{formatTHB(viewOrder.total)}</span>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setViewOrder(null)} className="w-full mt-8 py-5 bg-gray-50 text-gray-300 font-black text-[11px] uppercase tracking-[0.4em] rounded-[2rem] hover:text-red-500 transition-all leading-none font-black">
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
