import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../lib/utils';

export default function Orders() {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        async function load() {
            try {
                console.log("🔄 กำลังดึงข้อมูลออเดอร์ทั้งหมดจาก Firebase...");
                
                // 🚨 ปรับใหม่: ดึงทุกอย่างมาโชว์ก่อนเพื่อเช็คว่า Database เชื่อมติดไหม
                const q = query(
                    collection(db, 'orders'), 
                    orderBy('createdAt', 'desc'),
                    limit(20) // ดึงมาดู 20 รายการล่าสุด
                );

                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                console.log("✅ พบข้อมูลออเดอร์:", data.length, "รายการ");
                setOrders(data);
            } catch (err) {
                console.error("❌ เกิดข้อผิดพลาด:", err.message);
                setOrders([]);
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
            <h1 className="text-2xl font-bold mb-2">📋 รายการสั่งซื้อล่าสุด</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">พบทั้งหมด {orders.length} รายการในระบบ</p>

            {orders.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold mb-2">ไม่พบข้อมูลในระบบ</h3>
                    <p className="text-gray-500 mb-6">หากคุณเพิ่งสั่งซื้อ กรุณารอสักครู่แล้วลองรีเฟรชหน้าจอ</p>
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
                                            {order.createdAt ? formatDateTime(order.createdAt) : 'กำลังโหลดเวลา...'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold
                                            ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                                            ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                                            ${status.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                                            ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                                        `}>{status.label}</span>
                                    </div>
                                </div>
                                
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    👤 ผู้สั่ง: {order.customer?.name || 'ไม่ระบุชื่อ'}
                                </div>

                                <div className="border-t border-gray-50 dark:border-gray-800 pt-4 flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        สินค้า {order.items?.length || 0} รายการ
                                    </div>
                                    <div className="font-bold text-lg text-emerald-600">{formatTHB(order.total)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
