import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

export default function OrderManager() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const load = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
            setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch { setOrders([]); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
            addToast('อัปเดตสถานะสำเร็จ', 'success');
            load();
        } catch (e) {
            addToast('ไม่สามารถอัปเดต: ' + e.message, 'error');
        }
    };

    if (loading) {
        return <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-8">🛒 จัดการคำสั่งซื้อ</h1>

            {orders.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center text-gray-500 border border-gray-100 dark:border-gray-800">ยังไม่มีคำสั่งซื้อ</div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-emerald-50 dark:bg-emerald-900/20">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">รหัส</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">ลูกค้า</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">รายการ</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">ยอด</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">ชำระ</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">สถานะ</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">วันที่</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o) => {
                                const status = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                                return (
                                    <tr key={o.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">{o.orderId || o.id.slice(0, 8)}</td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium">{o.customer?.name || '-'}</div>
                                            <div className="text-xs text-gray-400">{o.customer?.phone}</div>
                                        </td>
                                        <td className="px-5 py-3">{(o.items || []).length} รายการ</td>
                                        <td className="px-5 py-3 font-semibold">{formatTHB(o.total)}</td>
                                        <td className="px-5 py-3 text-xs">
                                            {o.paymentMethod === 'card' ? '💳 บัตร' : o.paymentMethod === 'promptpay' ? '📱 QR' : '🏦 โอน'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <select
                                                value={o.status}
                                                onChange={(e) => updateStatus(o.id, e.target.value)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold outline-none cursor-pointer border-0
                          ${status.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : ''}
                          ${status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700' : ''}
                          ${status.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' : ''}
                          ${status.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700' : ''}
                          ${status.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700' : ''}
                        `}
                                            >
                                                {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                                    <option key={key} value={key}>{val.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
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
