import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, ORDER_STATUSES } from '../../lib/utils';
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
            addToast('อัปเดตสำเร็จ', 'success');
            load();
            if (selectedOrder) setSelectedOrder(null);
        } catch (e) { addToast('Error', 'error'); }
    };

    return (
        <div className="p-4 font-sans">
            <h1 className="text-2xl font-black mb-10 text-emerald-900 uppercase tracking-tighter">🛒 ORDER MANAGEMENT</h1>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-50 font-black uppercase text-[9px] text-gray-400">
                        <tr>
                            <th className="px-6 py-5 text-left">Order ID</th>
                            <th className="px-6 py-5 text-left">Customer</th>
                            <th className="px-6 py-5 text-center">Status</th>
                            <th className="px-6 py-5 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-black">
                        {orders.map((o) => {
                            const statusCfg = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                            return (
                                <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td onClick={() => { setSelectedOrder(o); setTrackingNum(o.trackingNumber || ''); }} className="px-6 py-7 text-emerald-600 cursor-pointer hover:underline uppercase tracking-tighter">
                                        #{o.orderId || o.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-7 text-left uppercase text-xs">
                                        <div className="text-gray-900">{o.customer?.name}</div>
                                        <div className="text-[9px] text-gray-400 mt-1 leading-none">{o.customer?.phone}</div>
                                    </td>
                                    <td className="px-6 py-7 text-center">
                                        {/* 📍 ใช้สีแบบเข้มเพื่อให้ตัดกับพื้นหลัง (Solid Color) */}
                                        <div className={`px-5 py-2.5 rounded-2xl text-[10px] uppercase tracking-widest border inline-flex items-center justify-center min-w-[140px] shadow-sm
                                            ${statusCfg.color === 'green' ? 'bg-emerald-600 text-white border-emerald-600' : 
                                              statusCfg.color === 'yellow' ? 'bg-amber-500 text-white border-amber-500' : 
                                              statusCfg.color === 'blue' ? 'bg-blue-600 text-white border-blue-600' : 
                                              'bg-red-600 text-white border-red-600'}`}>
                                            {statusCfg.label}
                                        </div>
                                    </td>
                                    <td className="px-6 py-7 text-right text-gray-900 text-base">{formatTHB(o.total)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 🚀 Modal Details (จัดระเบียบให้สีชัดเจน) */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
                    <div className="bg-white rounded-[3.5rem] p-10 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
                        <div className="flex justify-between items-center mb-8 px-2">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Order Overview</h2>
                            <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-inner">✕</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden flex-1 mb-8">
                            {/* ฝั่งข้อมูลสินค้า/ลูกค้า */}
                            <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar font-black uppercase">
                                <div className="bg-gray-50/50 p-7 rounded-[2.5rem] border border-gray-100">
                                    <h4 className="text-[10px] text-gray-300 tracking-widest mb-4">📍 Shipping Info</h4>
                                    <p className="text-xl text-gray-900 leading-none mb-1">{selectedOrder.customer?.name}</p>
                                    <p className="text-xs text-emerald-600 mb-4 tracking-tighter uppercase">📞 {selectedOrder.customer?.phone}</p>
                                    <p className="text-[11px] text-gray-500 leading-relaxed italic">{selectedOrder.customer?.address}</p>
                                </div>
                                <div className="space-y-3">
                                    {(selectedOrder.items || []).map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-50 rounded-2xl shadow-sm">
                                            <div className="text-xs text-gray-800 tracking-tight">{item.name} <span className="text-emerald-500 ml-2">x{item.qty}</span></div>
                                            <span className="text-xs text-gray-500">{formatTHB(item.price * item.qty)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ฝั่งอัปเดตสถานะ/สลิป */}
                            <div className="flex flex-col space-y-6 overflow-hidden">
                                <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] shadow-xl text-center font-black">
                                    <p className="text-[10px] opacity-50 uppercase tracking-widest mb-2">Total Amount</p>
                                    <p className="text-4xl tracking-tighter leading-none">{formatTHB(selectedOrder.total)}</p>
                                </div>

                                <div className="flex-1 bg-gray-50 rounded-[2.5rem] border-2 border-emerald-50 overflow-hidden relative min-h-[150px]">
                                    {selectedOrder.slipUrl ? (
                                        <img src={selectedOrder.slipUrl} alt="Slip" className="w-full h-full object-contain p-4 bg-white cursor-zoom-in" onClick={() => window.open(selectedOrder.slipUrl, '_blank')} />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-300 font-black text-[10px] tracking-widest uppercase">Waiting for payment slip</div>
                                    )}
                                </div>

                                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                                        {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                            <button key={key} onClick={() => { if (key !== 'shipped') updateStatus(selectedOrder.id, key); else setSelectedOrder({...selectedOrder, status: 'shipped'}); }}
                                                className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all shadow-sm
                                                    ${selectedOrder.status === key 
                                                        ? (
                                                            key === 'pending' ? 'bg-amber-500 border-amber-500 text-white' :
                                                            key === '
