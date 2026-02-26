import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../../lib/utils';
import { getDemoProducts } from '../Home';

export default function Dashboard() {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [pSnap, oSnap] = await Promise.all([
                    getDocs(collection(db, 'products')),
                    getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
                ]);
                setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setOrders(oSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch {
                setProducts(getDemoProducts());
                setOrders([]);
            }
            setLoading(false);
        }
        load();
    }, []);

    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        );
    }

    const stats = [
        { icon: '📦', label: 'สินค้าทั้งหมด', value: products.length, color: 'emerald' },
        { icon: '🛒', label: 'คำสั่งซื้อทั้งหมด', value: orders.length, color: 'amber' },
        { icon: '💰', label: 'รายได้รวม', value: formatTHB(totalRevenue), color: 'blue' },
        { icon: '👥', label: 'คำสั่งซื้อรอดำเนินการ', value: orders.filter((o) => o.status === 'pending').length, color: 'red' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-8">📊 แดชบอร์ด</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl
              ${s.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/30' : ''}
              ${s.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/30' : ''}
              ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
              ${s.color === 'red' ? 'bg-red-50 dark:bg-red-900/30' : ''}
            `}>{s.icon}</div>
                        <div>
                            <div className="text-2xl font-extrabold">{s.value}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent orders */}
            <h2 className="text-lg font-bold mb-4">🕐 คำสั่งซื้อล่าสุด</h2>
            {orders.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center text-gray-500 border border-gray-100 dark:border-gray-800">ยังไม่มีคำสั่งซื้อ</div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-emerald-50 dark:bg-emerald-900/20">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">รหัส</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">ลูกค้า</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">ยอด</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">สถานะ</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">วันที่</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 10).map((o) => {
                                const status = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                                return (
                                    <tr key={o.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-emerald-700 dark:text-emerald-400">{o.orderId || o.id.slice(0, 8)}</td>
                                        <td className="px-5 py-3">{o.customer?.name || '-'}</td>
                                        <td className="px-5 py-3 font-semibold">{formatTHB(o.total)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                        ${status.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : ''}
                        ${status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700' : ''}
                        ${status.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' : ''}
                        ${status.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700' : ''}
                        ${status.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700' : ''}
                      `}>{status.label}</span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">{formatDateTime(o.createdAt)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
