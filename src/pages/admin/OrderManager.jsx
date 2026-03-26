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
            <h1 className="text-2xl font-black mb-10 text-emerald-900 uppercase tracking-tighter">🛒 Order Management</h1>

            {orders.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center text-gray-400 border border-gray-100 shadow-sm font-bold uppercase tracking-widest">
                    No Orders Found
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50 border-b border-gray-50">
                            <tr>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">ID</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Total</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((o) => {
                                const status = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                                return (
                                    <tr key={o.id} className="hover:bg-emerald-50/10 transition-colors group">
                                        <td onClick={() => setSelectedOrder(o)} className="px-6 py-5 font-black text-emerald-600 cursor-pointer group-hover:underline">
                                            #{o.orderId || o.id.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-black text-gray-800 text-xs uppercase tracking-tight">{o.customer?.name || '-'}</div>
                                            <div className="text-[9px] text-gray-400 font-bold">{o.customer?.phone}</div>
                                        </td>
                                        <td className="px-6 py-5 font-black text-gray-900">{formatTHB(o.total)}</td>
                                        
                                        {/* ✨ Custom Status Selector UI */}
                                        <td className="px-6 py-5">
                                            <div className="relative inline-block text-left group/status">
                                                <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer shadow-sm
                                                    ${status.color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ''}
                                                    ${status.color === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' : ''}
                                                    ${status.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                                                    ${status.color === 'purple' ? 'bg-purple-50 text-purple-600 border-purple-100' : ''}
                                                    ${status.color === 'red' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                                                `}>
                                                    <span>{o.status === 'pending' ? '⏳' : o.status === 'paid' ? '💰' : o.status === 'shipped' ? '🚚' : o.status === 'finished' ? '✅' : '❌'}</span>
                                                    {status.label}
                                                    <span className="opacity-30 ml-1 text-[8px]">▼</span>
                                                </div>

                                                {/* Dropdown Menu */}
                                                <div className="absolute left-0 mt-2 w-44 bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden z-50 opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all duration-200 transform scale-95 group-hover/status:scale-100">
                                                    <div className="p-2 space-y-1">
                                                        {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                                            <button key={key} onClick={() => updateStatus(o.id, key)}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-colors
                                                                    ${o.status === key ? 'bg-gray-50 text-gray-900' : 'text-gray-400 hover:bg-gray-50 hover:text-emerald-600'}`}>
                                                                <span className="text-sm">{key === 'pending' ? '⏳' : key === 'paid' ? '💰' : key === 'shipped' ? '🚚' : key === 'finished' ? '✅' : '❌'}</span>
                                                                {val.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5 text-gray-400 text-[10px] font-black uppercase tracking-tighter">{formatDateTime(o.createdAt)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 🚨 Modal รายละเอียด (ฉบับปรับปรุง UI) */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] p-8 md:p-12 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden scale-in-center border border-white/20">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">ORDER DETAILS</h2>
                                <p className="text-[11px] font-black text-emerald-600 tracking-[0.3em] uppercase mt-1">ID: #{selectedOrder.orderId || selectedOrder.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-full transition-all flex items-center justify-center text-xl shadow-inner">✕</button>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-hidden flex-1">
                            {/* Left Column (5/12) */}
                            <div className="lg:col-span-5 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                                <div className="bg-gray-50/50 p-7 rounded-[2.5rem] border border-gray-100 shadow-inner">
                                    <h4 className="font-black text-gray-300 uppercase text-[10px] mb-4 tracking-widest">📍 Shipping Address</h4>
                                    <p className="font-black text-xl text-gray-900 leading-none mb-2">{selectedOrder.customer?.name}</p>
                                    <p className="text-xs font-black text-emerald-600 mb-4 tracking-tighter">📞 {selectedOrder.customer?.phone}</p>
                                    <p className="text-xs text-gray-500 font-bold leading-relaxed uppercase tracking-wide">
                                        {selectedOrder.customer?.address} ต. {selectedOrder.customer?.district} <br />
                                        อ. {selectedOrder.customer?.amphoe} จ. {selectedOrder.customer?.province} {selectedOrder.customer?.zipcode}
                                    </p>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-7 shadow-sm">
                                    <h4 className="font-black text-gray-300 uppercase text-[10px] mb-4 tracking-widest text-center">🛒 Order Items</h4>
                                    <div className="space-y-4">
                                        {(selectedOrder.items || []).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-lg shadow-sm border border-emerald-100">🥬</div>
                                                    <div>
                                                        <div className="font-black text-[12px] text-gray-800 leading-tight uppercase tracking-tight">{item.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{formatTHB(item.price)} × {item.qty}</div>
                                                    </div>
                                                </div>
                                                <span className="font-black text-sm text-emerald-600">{formatTHB(item.price * item.qty)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (7/12) */}
                            <div className="lg:col-span-7 flex flex-col h-full space-y-6">
                                <div className="bg-emerald-900 text-white p-8 rounded-[3rem] shadow-2xl shadow-emerald-200">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-2">Grand Total</p>
                                            <p className="text-4xl font-black tracking-tighter">{formatTHB(selectedOrder.total)}</p>
                                        </div>
                                        <div className="text-right border-l border-emerald-800 pl-8 space-y-1">
                                            <div className="flex justify-between gap-6 text-[11px] opacity-60 font-black uppercase tracking-widest"><span>Subtotal:</span> <span>{formatTHB(selectedOrder.subtotal)}</span></div>
                                            <div className="flex justify-between gap-6 text-[11px] opacity-60 font-black uppercase tracking-widest"><span>Shipping:</span> <span>{formatTHB(selectedOrder.shipping)}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-h-0 flex flex-col bg-gray-50 rounded-[3rem] border-2 border-emerald-50 overflow-hidden relative group">
                                    <h4 className="absolute top-6 left-0 right-0 z-10 font-black text-gray-300 uppercase text-[10px] tracking-widest text-center pointer-events-none">📸 Payment Evidence</h4>
                                    {selectedOrder.slipUrl ? (
                                        <img src={selectedOrder.slipUrl} alt="Slip" className="w-full h-full object-contain p-6 bg-white cursor-zoom-in" onClick={() => window.open(selectedOrder.slipUrl, '_blank')} />
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 space-y-2">
                                            <span className="text-4xl opacity-20">⏳</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Waiting for Payment</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-10 flex gap-4">
                            <button onClick={() => setSelectedOrder(null)} className="flex-1 py-5 bg-gray-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl active:scale-[0.98]">
                                Close Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
