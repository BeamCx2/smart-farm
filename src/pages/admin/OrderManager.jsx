import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

export default function OrderManager() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
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
        return <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" /></div>;
    }

    return (
        <div className="relative font-sans p-4">
            <h1 className="text-2xl font-black mb-10 text-emerald-900 uppercase tracking-tighter flex items-center gap-3">
                <span className="p-2 bg-emerald-100 rounded-xl">🛒</span> ORDER MANAGEMENT
            </h1>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-50">
                        <tr>
                            <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">ID</th>
                            <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Customer</th>
                            <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Total</th>
                            <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                            <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {orders.map((o) => {
                            const statusConfig = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                            return (
                                <tr key={o.id} className="hover:bg-emerald-50/10 transition-colors group">
                                    <td onClick={() => setSelectedOrder(o)} className="px-6 py-6 font-black text-emerald-600 cursor-pointer group-hover:underline">
                                        #{o.orderId || o.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="font-black text-gray-800 text-xs uppercase">{o.customer?.name || '-'}</div>
                                        <div className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">{o.customer?.phone}</div>
                                    </td>
                                    <td className="px-6 py-6 font-black text-gray-900 text-base">{formatTHB(o.total)}</td>
                                    
                                    {/* ✨ Custom Status Selector (Fixed Icon Duplicate) */}
                                    <td className="px-6 py-6">
                                        <div className="relative inline-block text-left group/status">
                                            {/* Badge หลักหน้าตาราง */}
                                            <div className={`px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer shadow-sm min-w-[140px]
                                                ${statusConfig.color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ''}
                                                ${statusConfig.color === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' : ''}
                                                ${statusConfig.color === 'red' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                                            `}>
                                                {/* 📍 เช็คไอคอนตรงนี้ตัวเดียวพอครับ ไม่ซ้อนแน่นอน */}
                                                <span className="text-sm leading-none">
                                                    {o.status === 'pending' ? '⏳' : o.status === 'paid' ? '💰' : o.status === 'shipped' ? '🚚' : o.status === 'finished' ? '✅' : '❌'}
                                                </span>
                                                <span className="flex-1">{statusConfig.label}</span>
                                                <span className="opacity-30 text-[8px]">▼</span>
                                            </div>

                                            {/* Dropdown Menu ตัวเลือก */}
                                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden z-[100] opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all duration-200 transform scale-95 group-hover/status:scale-100 origin-top-left">
                                                <div className="p-2 space-y-1">
                                                    {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                                        <button key={key} onClick={() => updateStatus(o.id, key)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-colors
                                                                ${o.status === key ? 'bg-gray-50 text-gray-900 font-black' : 'text-gray-400 hover:bg-gray-50 hover:text-emerald-600'}`}>
                                                            <span className="text-sm">
                                                                {key === 'pending' ? '⏳' : key === 'paid' ? '💰' : key === 'shipped' ? '🚚' : key === 'finished' ? '✅' : '❌'}
                                                            </span>
                                                            {val.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6 text-gray-400 text-[10px] font-black uppercase tracking-tighter">{formatDateTime(o.createdAt)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal รายละเอียดออเดอร์ (เหมือนเดิม) */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
                    {/* ... (โค้ด Modal เดิมที่ผมจัดเรียงให้ก่อนหน้านี้ บอสคงไว้ได้เลยครับ) ... */}
                </div>
            )}
        </div>
    );
}
