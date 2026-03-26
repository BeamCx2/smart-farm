import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

export default function OrderManager() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [trackingNum, setTrackingNum] = useState(''); // เก็บเลขพัสดุชั่วคราวขณะพิมพ์
    const { addToast } = useToast();

    const load = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
            setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch { setOrders([]); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    // ฟังก์ชันอัปเดตสถานะ พร้อมเลขพัสดุ (ถ้ามี)
    const updateStatus = async (orderId, newStatus, tracking = '') => {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'shipped' && tracking) {
                updateData.trackingNumber = tracking;
            }
            
            await updateDoc(doc(db, 'orders', orderId), updateData);
            addToast('อัปเดตข้อมูลออเดอร์แล้ว', 'success');
            load();
            if (selectedOrder) setSelectedOrder(null); // ปิด modal หลังเซฟ
        } catch (e) {
            addToast('ผิดพลาด: ' + e.message, 'error');
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" /></div>;

    return (
        <div className="p-4 font-sans">
            <h1 className="text-2xl font-black mb-10 text-emerald-900 uppercase tracking-tighter">📦 ORDER MANAGEMENT</h1>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-50">
                        <tr>
                            <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Order</th>
                            <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                            <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Status & Tracking</th>
                            <th className="px-6 py-5 text-right text-[9px] font-black uppercase tracking-widest text-gray-400">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {orders.map((o) => {
                            const statusConfig = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                            return (
                                <tr key={o.id} className="hover:bg-emerald-50/10 transition-colors">
                                    <td onClick={() => { setSelectedOrder(o); setTrackingNum(o.trackingNumber || ''); }} className="px-6 py-6 font-black text-emerald-600 cursor-pointer hover:underline">
                                        #{o.orderId || o.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="font-black text-gray-800 text-xs">{o.customer?.name}</div>
                                        <div className="text-[9px] text-gray-400 font-bold tracking-widest">{o.customer?.phone}</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-2">
                                            <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 w-fit
                                                ${statusConfig.color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ''}
                                                ${statusConfig.color === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' : ''}
                                                ${statusConfig.color === 'red' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                                            `}>
                                                {o.status === 'pending' ? '⏳' : o.status === 'paid' ? '💰' : o.status === 'shipped' ? '🚚' : o.status === 'finished' ? '✅' : '❌'}
                                                {statusConfig.label}
                                            </div>
                                            
                                            {/* ✨ แสดงเลขพัสดุเฉพาะเมื่อสถานะเป็น shipped เท่านั้น */}
                                            {o.status === 'shipped' && o.trackingNumber && (
                                                <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-lg w-fit border border-blue-100 animate-pulse">
                                                    📍 TRACKING: {o.trackingNumber}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right font-black text-gray-900 text-base">{formatTHB(o.total)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 🚀 Modal รายละเอียดและแก้ไขสถานะ */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
                    <div className="bg-white rounded-[3.5rem] p-10 max-w-2xl w-full shadow-2xl border border-white/20 scale-in-center">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Order Details</h2>
                            <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500">✕</button>
                        </div>

                        <div className="space-y-6">
                            {/* ส่วนเลือกสถานะ */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Update Order Status</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                        <button 
                                            key={key}
                                            onClick={() => {
                                                if (key !== 'shipped') {
                                                    updateStatus(selectedOrder.id, key);
                                                } else {
                                                    // ถ้าเลือก shipped ให้รอใส่เลขพัสดุก่อน (ยังไม่อัปเดตทันที)
                                                    setTrackingNum(selectedOrder.trackingNumber || '');
                                                    setSelectedOrder({...selectedOrder, status: 'shipped'});
                                                }
                                            }}
                                            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2
                                                ${selectedOrder.status === key ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-50 text-gray-400 hover:border-emerald-200'}`}
                                        >
                                            {val.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ✨ ช่องกรอกเลขพัสดุ (จะขึ้นมาเฉพาะตอนเลือกสถานะจัดส่ง) */}
                            {selectedOrder.status === 'shipped' && (
                                <div className="animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 block">Tracking Number (เลขขนส่ง) *</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={trackingNum}
                                            onChange={(e) => setTrackingNum(e.target.value)}
                                            className="flex-1 px-6 py-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-sm font-black text-blue-900 outline-none focus:bg-white transition-all shadow-inner"
                                            placeholder="กรอกเลขพัสดุที่นี่..."
                                        />
                                        <button 
                                            onClick={() => updateStatus(selectedOrder.id, 'shipped', trackingNum)}
                                            className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                                        >
                                            Save Tracking
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
