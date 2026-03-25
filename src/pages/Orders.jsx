import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../lib/utils';

export default function Orders() {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

useEffect(() => {
    // 🚨 1. ต้องรอให้ authLoading เป็น false ก่อน (รอระบบเช็คชื่อเสร็จ)
    if (authLoading) return;

    // 🚨 2. ถ้าไม่มี user (ไม่ได้ login) ก็ไม่ต้องดึงข้อมูล
    if (!user) {
        setOrders([]);
        setLoading(false);
        return;
    }

    async function load() {
        try {
            setLoading(true);
            // 🚨 3. ใส่ userId ลงไปใน Query ให้ถูกต้อง
            const q = query(
                collection(db, 'orders'),
                where('userId', '==', user.uid), // 👈 เช็คตรงนี้ว่าตัวสะกด userId ตรงกับใน Firebase ไหม
                orderBy('createdAt', 'desc')
            );

            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setOrders(data);
        } catch (err) {
            console.error("Fetch error:", err.message);
        } finally {
            setLoading(false);
        }
    }

    load();
}, [user, authLoading]); // 🚨 4. ต้องใส่ [user, authLoading] ไว้ตรงนี้เพื่อให้มันรันใหม่เมื่อ login เสร็จ

    // ส่วนการแสดงผล Loading
    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        );
    }

    // ถ้าไม่ได้ Login ให้บอกให้ไป Login ก่อน
    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="text-xl font-bold mb-4">🔐 กรุณาเข้าสู่ระบบ</h2>
                <p className="text-gray-500 mb-6">เพื่อดูรายการสั่งซื้อของคุณ</p>
                <Link to="/login" className="px-8 py-3 bg-emerald-600 text-white rounded-full font-semibold">เข้าสู่ระบบ</Link>
            </div>
        );
    }

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold mb-2">📋 คำสั่งซื้อของฉัน</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">พบทั้งหมด {orders.length} รายการ</p>

            {orders.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold mb-2">ยังไม่มีคำสั่งซื้อ</h3>
                    <p className="text-gray-500 mb-6">คุณยังไม่ได้สั่งซื้อสินค้า หรือออเดอร์เก่าอาจไม่มีข้อมูลเจ้าของ</p>
                    <Link to="/products" className="inline-flex px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow-lg transition-all">ไปที่หน้าร้านค้า</Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {orders.map((order) => {
                        const status = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                        return (
                            <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="font-bold text-emerald-700 dark:text-emerald-400">#{order.orderId || order.id.slice(0, 8)}</div>
                                        <div className="text-xs text-gray-400 mt-1">{order.createdAt ? formatDateTime(order.createdAt) : 'เพิ่งสั่งซื้อ'}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 uppercase">ยอดสุทธิ</div>
                                            <div className="font-bold text-emerald-600">{formatTHB(order.total)}</div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold
                                            ${status.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                                        `}>{status.label}</span>
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
