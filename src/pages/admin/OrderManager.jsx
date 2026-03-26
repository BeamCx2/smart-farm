import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

export default function OrderManager() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [trackingNum, setTrackingNum] = useState('');
    const { addToast } = useToast();

    const load = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
            setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch { setOrders([]); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const updateStatus = async (orderId, newStatus, tracking = '') => {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'shipped' && tracking) updateData.trackingNumber = tracking;
            await updateDoc(doc(db, 'orders', orderId), updateData);
            addToast('อัปเดตสถานะสำเร็จ', 'success');
            load();
            if (selectedOrder) setSelectedOrder(null);
        } catch (e) { addToast('ผิดพลาด: ' + e.message, 'error'); }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" /></div>;

    return (
        <div className="p-4 font-sans">
            <h1 className="text-2xl font-black mb-10 text-emerald-900 uppercase tracking-tighter flex items-center gap-3">
                <span className="p-2 bg-emerald-100 rounded-xl">🛒</span> ORDER MANAGEMENT
            </h1>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-sm text-center">
                    <thead className="bg-gray-50/50 border-b border-gray-50 font-black uppercase text-[9px] text-gray-400 tracking-widest">
                        <tr>
                            <th className="px-6 py-5 text-left">Order ID</th>
                            <th className="px-6 py-5 text-left">Customer</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-black">
                        {orders.map((o) => {
                            const statusConfig = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                            return (
                                <tr key={o.id} className="hover:bg-emerald-50/10 transition-colors group">
                                    <td onClick={() => { setSelectedOrder(o); setTrackingNum(o.trackingNumber || ''); }} className="px-6 py-7 text-left text-emerald-600 cursor-pointer hover:underline uppercase tracking-tighter">
                                        #{o.orderId || o.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-7 text-left uppercase text-xs">
                                        <div className="text-gray-800">{o.customer?.name}</div>
                                        <div className="text-[9px] text-gray-400 tracking-widest mt-1">{o.customer?.phone}</div>
                                    </td>
                                    <td className="px-6 py-7">
                                        {/* 🎖️ Badge สถานะ (ดึงจาก utils.js ตัวเดียว ไม่ใส่เพิ่มเอง) */}
                                        <div className={`px-5 py-2 rounded-2xl text-[9px] uppercase tracking-widest border inline-flex items-center justify-center gap-2 min-w-[130px]
                                            ${statusConfig.color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                              statusConfig.color === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                              statusConfig.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                            {statusConfig.label}
                                        </div>
                                    </td>
                                    <td className="px-6 py-7 text-right text-gray-900 text-base">{formatTHB(o.total)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 🚀 Modal: Order Overview */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in">
                    <div className="bg-white rounded-[3.5rem] p-10 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
                        <div className="flex justify-between items-center mb-8 shrink-0 px-2">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Order Details</h2>
                            <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-inner">✕</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden flex-1 mb-8">
                            {/* ฝั่งซ้าย: ข้อมูล */}
                            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100">
                                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">📍 Shipping Address</h4>
                                    <p className="font-black text-lg text-gray-900 leading-none mb-1">{selectedOrder.customer?.name}</p>
                                    <p className="text-xs font-black text-emerald-600 mb-3 tracking-tighter uppercase">📞 {selectedOrder.customer?.phone}</p>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase leading-relaxed tracking-wider italic">{selectedOrder.customer?.address}</p>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2">🛒 Order Items</h4>
                                    {(selectedOrder.items || []).map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-50 rounded-2xl shadow-sm">
                                            <div className="font-black text-xs text-gray-800 tracking-tight uppercase">{item.name} <span className="text-emerald-500 ml-2">x{item.qty}</span></div>
                                            <span className="font-black text-xs text-gray-500">{formatTHB(item.price * item.qty)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ฝั่งขวา: การชำระเงิน & สถานะ */}
                            <div className="space-y-6 flex flex-col overflow-hidden">
                                <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] shadow-xl shrink-0">
                                    <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-2 text-center">Grand Total</p>
                                    <p className="text-4xl font-black tracking-tighter text-center">{formatTHB(selectedOrder.total)}</p>
                                </div>

                                <div className="bg-gray-50/50 rounded-[2.5rem] border-2 border-emerald-50 overflow-hidden relative group flex-1 min-h-[150px]">
                                    {selectedOrder.slipUrl ? (
                                        <img src={selectedOrder.slipUrl} alt="Slip" className="w-full h-full object-contain p-4 bg-white cursor-zoom-in" onClick={() => window.open(selectedOrder.slipUrl, '_blank')} />
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-300"><span className="text-4xl opacity-20 mb-2">⏳</span><p className="text-[9px] font-black uppercase tracking-widest opacity-40">Waiting for Payment</p></div>
                                    )}
                                </div>

                                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm shrink-0">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                                        {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                            <button key={key} onClick={() => { if (key !== 'shipped') updateStatus(selectedOrder.id, key); else setSelectedOrder({...selectedOrder, status: 'shipped'}); }}
                                                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all
                                                    ${selectedOrder.status === key ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm' : 'border-gray-50 text-gray-300 hover:border-emerald-100'}`}>
                                                {val.label}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedOrder.status === 'shipped' && (
                                        <div className="mt-4 flex gap-2 animate-in slide-in-from-top-4">
                                            <input type="text" value={trackingNum} onChange={(e) => setTrackingNum(e.target.value)} className="flex-1 px-4 py-3 bg-white border border-blue-100 rounded-xl text-xs font-black text-blue-600 outline-none shadow-inner uppercase" placeholder="Tracking Number..." />
                                            <button onClick={() => updateStatus(selectedOrder.id, 'shipped', trackingNum)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-100">Save</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setSelectedOrder(null)} className="w-full py-5 bg-gray-900 text-white font-black text-[11px] uppercase tracking-[0.5em] rounded-2xl shadow-xl transition-all hover:bg-black">
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
