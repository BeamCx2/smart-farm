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

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">ORDER HUB</h1>
                    <p className="text-slate-500 uppercase text-xs font-bold tracking-widest mt-1">Management Console</p>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((o) => (
                                    <tr key={o.id} onClick={() => { setSelectedOrder(o); setTrackingNum(o.trackingNumber || ''); }} className="hover:bg-emerald-50/50 cursor-pointer transition-colors">
                                        <td className="px-6 py-5 font-bold text-emerald-700 text-sm">#{o.orderId || o.id.slice(0, 8)}</td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-800">{o.customer?.name}</div>
                                            <div className="text-xs text-slate-400">{o.customer?.phone}</div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                                                o.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                o.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                o.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                                {ORDER_STATUSES[o.status]?.label || o.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-800">{formatTHB(o.total || o.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal - ปรับ Layout ใหม่ให้พอดีหน้า */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Order Details</h2>
                                <p className="text-emerald-600 font-bold text-[10px] tracking-widest uppercase">#{selectedOrder.orderId || selectedOrder.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors">✕</button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                
                                {/* Left: Info & Items */}
                                <div className="lg:col-span-4 space-y-6">
                                    <section className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer Info</h3>
                                        <p className="font-black text-slate-800 text-base mb-1">{selectedOrder.customer?.name}</p>
                                        <p className="text-emerald-600 font-bold text-sm mb-3">{selectedOrder.customer?.phone}</p>
                                        <div className="text-xs text-slate-500 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                                            {selectedOrder.customer?.address} {selectedOrder.customer?.subDistrict} {selectedOrder.customer?.district} {selectedOrder.customer?.province} {selectedOrder.customer?.zipcode}
                                        </div>
                                    </section>

                                    <section className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Items</h3>
                                        <div className="space-y-2">
                                            {(selectedOrder.items || []).map((item, i) => (
                                                <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{item.name}</p>
                                                        <p className="text-[10px] text-emerald-600 font-black uppercase">x{item.qty}</p>
                                                    </div>
                                                    <p className="text-xs font-black text-slate-800">{formatTHB(item.price * item.qty)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Center: Slip - ปรับให้เล็กลงพอดีหน้า */}
                                <div className="lg:col-span-4 flex flex-col">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Payment Slip</h3>
                                    <div className="bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex-1 flex items-center justify-center relative group min-h-[300px]">
                                        {selectedOrder.slipUrl ? (
                                            <img src={selectedOrder.slipUrl} className="w-full h-full object-contain p-2" alt="slip" />
                                        ) : (
                                            <p className="text-[10px] font-black text-slate-300 uppercase">No Slip Uploaded</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Summary & Action */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-emerald-900 p-6 rounded-[2rem] text-center shadow-xl shadow-emerald-900/20">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Grand Total</p>
                                        <p className="text-3xl font-black text-white">{formatTHB(selectedOrder.total || selectedOrder.amount)}</p>
                                    </div>

                                    <section className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Update Status</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => key !== 'shipped' ? updateStatus(selectedOrder.id, key) : setSelectedOrder({...selectedOrder, status: 'shipped'})}
                                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                                                        selectedOrder.status === key 
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                                                        : 'bg-white text-slate-400 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
                                                    }`}
                                                >
                                                    {val.label}
                                                </button>
                                            ))}
                                        </div>

                                        {selectedOrder.status === 'shipped' && (
                                            <div className="mt-4 p-3 bg-white rounded-2xl border border-emerald-100 space-y-2 animate-in slide-in-from-top-2">
                                                <input 
                                                    type="text" 
                                                    value={trackingNum} 
                                                    onChange={(e) => setTrackingNum(e.target.value)}
                                                    className="w-full px-4 py-2 text-xs font-bold bg-slate-50 rounded-lg outline-none focus:ring-1 ring-emerald-500"
                                                    placeholder="Tracking Number..."
                                                />
                                                <button 
                                                    onClick={() => updateStatus(selectedOrder.id, 'shipped', trackingNum)}
                                                    className="w-full py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg"
                                                >
                                                    SAVE TRACKING
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <button onClick={() => setSelectedOrder(null)} className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-colors">Close Console</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}