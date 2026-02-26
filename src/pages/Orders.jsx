import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../lib/utils';

export default function Orders() {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        async function load() {
            if (!isFirebaseConfigured) {
                setOrders([]);
                setLoading(false);
                return;
            }
            try {
                let q;
                if (user) {
                    q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
                } else {
                    q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
                }
                const snap = await getDocs(q);
                setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch {
                setOrders([]);
            }
            setLoading(false);
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
            <p className="text-gray-500 dark:text-gray-400 mb-8">{orders.length} คำสั่งซื้อ</p>

            {orders.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold mb-2">ยังไม่มีคำสั่งซื้อ</h3>
                    <p className="text-gray-500 mb-6">คุณยังไม่ได้ทำการสั่งซื้อ</p>
                    <Link to="/products" className="inline-flex px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow-lg transition-all">เลือกซื้อสินค้า</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const status = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                        return (
                            <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                    <div>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{order.orderId || order.id}</span>
                                        <span className="text-sm text-gray-400 ml-3">{formatDateTime(order.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            {order.paymentMethod === 'card' ? '💳 บัตร' : order.paymentMethod === 'promptpay' ? '📱 PromptPay' : '🏦 โอนเงิน'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold
                      ${status.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                      ${status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}
                      ${status.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
                      ${status.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : ''}
                      ${status.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                    `}>{status.label}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 mb-4">
                                    {(order.items || []).map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
                                            <img src={item.image || 'https://placehold.co/40x40/e8f5e9/2e7d32?text=P'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                            <div>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-gray-500">{formatTHB(item.price)} × {item.qty}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 text-sm">
                                    <span className="text-gray-500">จัดส่งที่: {order.customer?.address}, {order.customer?.province}</span>
                                    <span className="font-bold text-base">ยอดรวม: {formatTHB(order.total)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
