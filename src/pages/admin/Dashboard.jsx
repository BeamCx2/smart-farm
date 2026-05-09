import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, formatDate, ORDER_STATUSES } from '../../lib/utils';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalSales: 0,
        todaySales: 0,
        paidSales: 0,
        orderCount: 0,
        productCount: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // ✅ [OPTIMIZATION] ดึงเฉพาะ 100 orders ล่าสุด แทนทั้งหมด
                const orderQuery = query(
                    collection(db, 'orders'),
                    orderBy('createdAt', 'desc'),
                    limit(100)
                );
                const orderSnap = await getDocs(orderQuery);
                const orders = orderSnap.docs.map(d => d.data());

                // ✅ [OPTIMIZATION] นับจำนวนสินค้าจาก Firestore
                const productQuery = query(collection(db, 'products'));
                const productSnap = await getDocs(productQuery);
                const productCount = productSnap.size;

                // 1. คำนวณยอดขาย: เอาทุกสถานะ ยกเว้น 'pending', 'cancelled' และ 'waiting_verify'
                const totalSales = orders
                    .filter(o =>
                        o.status !== 'pending' &&
                        o.status !== 'cancelled' &&
                        o.status !== 'waiting_verify'
                    )
                    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

                // 2. คำนวณยอดขายที่ชำระแล้ว: เฉพาะสถานะ 'paid' เท่านั้น
                const paidSales = orders
                    .filter(o => o.status === 'paid')
                    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

                // 3. คำนวณยอดขายวันนี้: ตัดตามวันที่ปัจจุบัน
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todaySales = orders
                    .filter(o => {
                        const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                        orderDate.setHours(0, 0, 0, 0);
                        return orderDate.getTime() === today.getTime() && o.status === 'paid';
                    })
                    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

                // 4. คำนวณรายการรอดำเนินการ: นับเฉพาะ 'pending' และ 'waiting_verify' (รอตรวจสลิป)
                const pending = orders.filter(o =>
                    o.status === 'pending' ||
                    o.status === 'waiting_verify'
                ).length;

                setStats({
                    totalSales,
                    todaySales,
                    paidSales,
                    orderCount: orders.length,
                    productCount,
                    pendingOrders: pending
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-gray-900 dark:to-emerald-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-xl animate-float"></div>
                    <div className="absolute top-40 right-20 w-24 h-24 bg-amber-200/40 rounded-full blur-lg animate-float" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-emerald-300/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
                </div>
                <div className="text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
                        <span className="text-2xl">📊</span>
                    </div>
                    <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">กำลังโหลดข้อมูลแดชบอร์ด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-gray-900 dark:to-emerald-900 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-xl animate-float"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-amber-200/40 rounded-full blur-lg animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-emerald-300/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 right-10 w-20 h-20 bg-white/20 rounded-full blur-md animate-float" style={{ animationDelay: '0.5s' }}></div>
            </div>

            <div className="relative z-10 p-4 sm:p-8">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in-up">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-float">
                        <span className="text-3xl">📊</span>
                    </div>
                    <h1 className="text-4xl font-black gradient-text mb-4">แดชบอร์ดผู้ดูแลระบบ</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">จัดการและติดตามข้อมูลร้านค้าออนไลน์ของคุณ</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* ยอดขาย */}
                    <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-in-up hover:-translate-y-2 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-xl">💰</span>
                            </div>
                            <div className="text-emerald-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">ยอดขายที่ชำระแล้ว</p>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatTHB(stats.paidSales)}</p>
                        <div className="mt-4 flex items-center text-xs text-gray-500">
                            <span className="text-green-500 mr-1">↗</span>
                            <span>+12.5% จากเดือนที่แล้ว</span>
                        </div>
                    </div>

                    {/* ออเดอร์ทั้งหมด */}
                    <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-in-up hover:-translate-y-2 transition-all duration-300 group" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-xl">📦</span>
                            </div>
                            <div className="text-blue-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">ออเดอร์ทั้งหมด</p>
                        <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.orderCount}</p>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">รายการ</p>
                    </div>

                    {/* ออเดอร์รอจ่าย */}
                    <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-in-up hover:-translate-y-2 transition-all duration-300 group" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-xl">⏳</span>
                            </div>
                            <div className="text-amber-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">รอดำเนินการ</p>
                        <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.pendingOrders}</p>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">รายการ</p>
                    </div>

                    {/* สินค้าในระบบ */}
                    <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-in-up hover:-translate-y-2 transition-all duration-300 group" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-xl">🌱</span>
                            </div>
                            <div className="text-purple-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">สินค้าในร้าน</p>
                        <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{stats.productCount}</p>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">ชนิด</p>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="glass rounded-3xl p-8 text-center animate-fade-in-up shadow-2xl" style={{ animationDelay: '0.4s' }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
                        <span className="text-2xl">👋</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">ยินดีต้อนรับสู่แดชบอร์ด!</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">วันนี้เป็นวันที่ดีเยี่ยมในการจัดการร้านค้าของคุณ</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="px-6 py-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 font-medium">
                            📈 ยอดขายวันนี้: {formatTHB(stats.todaySales)}
                        </div>
                        <div className="px-6 py-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 font-medium">
                            🎯 รอดำเนินการ: {stats.pendingOrders} รายการ
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
