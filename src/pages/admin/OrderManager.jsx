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

    // 🔄 โหลดข้อมูลออเดอร์จาก Firestore
    const load = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
            setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Load Error:", error);
            setOrders([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    // 🛠 อัปเดตสถานะออเดอร์
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
        return (
            <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative font-sans p-2">
            <h1 className="text-2xl font-black mb-8 text-emerald-900 tracking-tighter uppercase">🛒 Order Management</h1>

            {/* 📊 ตารางรายการสั่งซื้อ */}
            {orders.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center text-gray-400 border border-gray-100 shadow-sm">
                    ยังไม่มีรายการคำสั่งซื้อในขณะนี้
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50 border-b border-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">รหัสสั่งซื้อ</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">ลูกค้า</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">ยอดสุทธิ</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">สถานะ</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">วันที่</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((o) => {
                                    const status = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                                    return (
                                        <tr key={o.id} className="hover:bg-emerald-50/10 transition-colors group">
                                            <td onClick={() => setSelectedOrder(o)} className="px-6 py-4 font-black text-emerald-600 cursor-pointer group-hover:underline">
                                                #{o.orderId || o.id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800 leading-tight">{o.customer?.name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold tracking-tighter">{o.customer?.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900">{formatTHB(o.total)}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={o.status}
                                                    onChange={(e) => updateStatus(o.id, e.target.value)}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black outline-none cursor-pointer border-0 transition-all shadow-sm
                                                        ${status.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                                                        ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                        ${status.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                                                        ${status.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                                                        ${status.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                                                    `}
                                                >
                                                    {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                                        <option key={key} value={key}>{val.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-[10px] font-bold uppercase">{formatDateTime(o.createdAt)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 🚨 Modal ฉบับ Single Page (สวย เป๊ะ ไม่ต้องเลื่อน) */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
                    <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 tracking-tighter">รายละเอียดคำสั่งซื้อ</h2>
                                <p className="text-[10px] font-bold text-emerald-600 tracking-[0.2em] uppercase">Order ID: #{selectedOrder.orderId || selectedOrder.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all text-xl">✕</button>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden flex-1">
                            
                            {/* ฝั่งซ้าย: ข้อมูลลูกค้า + สินค้า */}
                            <div className="lg:col-span-5 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                                    <h4 className="font-black text-gray-400 uppercase text-[9px] mb-3 tracking-widest">📍 ที่อยู่จัดส่ง</h4>
                                    <p className="font-black text-lg text-emerald-900 leading-tight">{selectedOrder.customer?.name}</p>
                                    <p className="text-xs font-bold text-gray-500 mb-2">📞 {selectedOrder.customer?.phone}</p>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                        {selectedOrder.customer?.address} ต. {selectedOrder.customer?.district} <br />
                                        อ. {selectedOrder.customer?.amphoe} จ. {selectedOrder.customer?.province} {selectedOrder.customer?.zipcode}
                                    </p>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-[2rem] p-5">
                                    <h4 className="font-black text-gray-400 uppercase text-[9px] mb-3 tracking-widest text-center">🛒 รายการสินค้า</h4>
                                    <div className="space-y-3">
                                        {(selectedOrder.items || []).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-sm shadow-sm">🥬</div>
                                                    <div>
                                                        <div className="font-bold text-[11px] text-gray-800 leading-tight">{item.name}</div>
                                                        <div className="text-[9px] text-gray-400 font-bold uppercase">{formatTHB(item.price)} × {item.qty}</div>
                                                    </div>
                                                </div>
                                                <span className="font-black text-xs text-emerald-600">{formatTHB(item.price * item.qty)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ฝั่งขวา: ยอดรวม + รูปสลิป */}
                            <div className="lg:col-span-7 flex flex-col h-full space-y-4 overflow-hidden">
                                <div className="bg-emerald-900 text-white p-6 rounded-[2.5rem] shadow-xl shadow-emerald-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">ยอดรวมสุทธิ</p>
                                            <p className="text-3xl font-black">{formatTHB(selectedOrder.total)}</p>
                                        </div>
                                        <div className="text-right border-l border-emerald-800 pl-6 space-y-1">
                                            <div className="flex justify-between gap-4 text-[10px] opacity-60 font-bold uppercase"><span>สินค้า:</span> <span>{formatTHB(selectedOrder.subtotal)}</span></div>
                                            <div className="flex justify-between gap-4 text-[10px] opacity-60 font-bold uppercase"><span>ค่าจัดส่ง:</span> <span>{formatTHB(selectedOrder.shipping)}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-h-0 flex flex-col bg-gray-50 rounded-[2.5rem] border-2 border-emerald-50 overflow-hidden relative group">
                                    <h4 className="absolute top-4 left-0 right-0 z-10 font-black text-gray-300 uppercase text-[9px] tracking-widest text-center pointer-events-none">📸 หลักฐานการชำระเงิน</h4>
                                    {selectedOrder.slipUrl ? (
                                        <div className="w-full h-full p-4 flex items-center justify-center bg-white relative">
                                            <img
                                                src={selectedOrder.slipUrl}
                                                alt="Slip"
                                                className="max-w-full max-h-full object-contain cursor-zoom-in"
                                                onClick={() => window.open(selectedOrder.slipUrl, '_blank')}
                                            />
                                            <div className="absolute inset-0 bg-emerald-900/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                                <span className="bg-white/95 text-emerald-900 px-5 py-2 rounded-full font-black text-[10px] shadow-2xl backdrop-blur-sm border border-emerald-50">🔍 ดูรูปใหญ่</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                                            <span className="text-3xl mb-2 opacity-20">⏳</span>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">รอดำเนินการแนบสลิป</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Button */}
                        <div className="mt-6">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-[0.98]"
                            >
                                ปิดหน้าต่างข้อมูล
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
