import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../lib/utils';

export default function Orders() {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // รอให้ระบบ Auth โหลดสถานะเสร็จก่อน
        if (authLoading) return;

        async function load() {
            try {
                let q;
                // บังคับดึงข้อมูลจาก Firebase
                if (user?.uid) {
                    console.log("Fetching real orders for UID:", user.uid);
                    q = query(
                        collection(db, 'orders'), 
                        where('userId', '==', user.uid), 
                        orderBy('createdAt', 'desc')
                    );
                } else {
                    console.log("No user found, showing latest 10 public orders...");
                    q = query(
                        collection(db, 'orders'), 
                        orderBy('createdAt', 'desc'), 
                        limit(10)
                    );
                }

                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setOrders(data);
            } catch (err) {
                console.error("Firebase fetch error:", err.message);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [user, authLoading]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold mb-2">📋 คำสั่งซื้อของฉัน</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">พบ {orders.length} รายการ</p>

            {orders.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold mb-2">ยังไม่มีคำสั่งซื้อ</h3>
                    <p className="text-gray-500 mb-6">เริ่มสั่งซื้อผักสดจากฟาร์มของเราได้เลย</p>
                    <Link to="/products" className="inline-flex px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow-lg transition-all">ไปที่หน้าร้านค้า</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const status = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                        return (
                            <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                    <div>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">#{order.orderId || order.id.slice(0, 8)}</span>
                                        <span className="text-sm text-gray-400 ml-3">
                                            {order.createdAt ? formatDateTime(order.createdAt) : 'เพิ่งสั่งซื้อ'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                                            {order.paymentMethod === 'promptpay' ? '📱 PromptPay' : '🏦 โอนเงิน'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold
                                            ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                                            ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                                            ${status.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                                            ${status.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                                            ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                                        `}>{status.label}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mb-4 border-y border-gray-50 dark:border-gray-800 py-4">
                                    {(order.items || []).map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <img src={item.image || 'https://placehold.co/40x40?text=P'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                            <div>
                                                <div className="text-sm font-medium">{item.name}</div>
                                                <div className="text-xs text-gray-500">{formatTHB(item.price)} × {item.qty}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="text-sm text-gray-500">
                                        <span className="hidden sm:inline">จัดส่งที่: </span>{order.customer?.name} ({order.customer?.province})
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">ยอดรวมสุทธิ</div>
                                        <div className="font-bold text-lg text-emerald-600">{formatTHB(order.total)}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
