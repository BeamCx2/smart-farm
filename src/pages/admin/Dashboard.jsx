import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, formatDate, ORDER_STATUSES } from '../../lib/utils';

// ❌ ลบ import { getDemoProducts } ออกเรียบร้อยครับ

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalSales: 0,
        orderCount: 0,
        productCount: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);

  // ... (ส่วนบนเหมือนเดิม) ...

    useEffect(() => {
        async function fetchStats() {
            try {
                const orderSnap = await getDocs(collection(db, 'orders'));
                const orders = orderSnap.docs.map(d => d.data());
                
                const productSnap = await getDocs(collection(db, 'products'));
                
                // 1. คำนวณยอดขาย: เอาทุกสถานะ ยกเว้น 'pending', 'cancelled' และ 'waiting_verify'
                const totalSales = orders
                    .filter(o => 
                        o.status !== 'pending' && 
                        o.status !== 'cancelled' && 
                        o.status !== 'waiting_verify'
                    )
                    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

                // 2. คำนวณรายการรอดำเนินการ: นับเฉพาะ 'pending' และ 'waiting_verify' (รอตรวจสลิป)
                const pending = orders.filter(o => 
                    o.status === 'pending' || 
                    o.status === 'waiting_verify'
                ).length;

                setStats({
                    totalSales,
                    orderCount: orders.length,
                    productCount: productSnap.size,
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

// ... (ส่วนล่างเหมือนเดิม) ...

    if (loading) return <div className="p-10 text-center animate-pulse text-emerald-600">กำลังประมวลผลข้อมูล...</div>;

    return (
        <div className="p-4 sm:p-8">
            <h1 className="text-2xl font-black mb-8 text-gray-800 dark:text-gray-100 uppercase tracking-tight">📊 แดชบอร์ดผู้ดูแลระบบ</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* ยอดขาย */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ยอดขายที่ชำระแล้ว</p>
                    <p className="text-3xl font-black text-emerald-600">{formatTHB(stats.totalSales)}</p>
                </div>

                {/* ออเดอร์ทั้งหมด */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ออเดอร์ทั้งหมด</p>
                    <p className="text-3xl font-black text-gray-800 dark:text-gray-100">{stats.orderCount} <span className="text-sm font-bold text-gray-400">รายการ</span></p>
                </div>

                {/* ออเดอร์รอจ่าย */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">รอดำเนินการ</p>
                    <p className="text-3xl font-black text-amber-500">{stats.pendingOrders} <span className="text-sm font-bold text-gray-400">รายการ</span></p>
                </div>

                {/* สินค้าในระบบ */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">สินค้าในร้าน</p>
                    <p className="text-3xl font-black text-blue-500">{stats.productCount} <span className="text-sm font-bold text-gray-400">ชนิด</span></p>
                </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 text-center">
                <p className="text-emerald-800 dark:text-emerald-400 font-bold">ยินดีต้อนรับ!</p>
            </div>
        </div>
    );
}
