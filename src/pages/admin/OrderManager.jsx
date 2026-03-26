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
        return <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
    }

    return (
        <div className="relative font-sans">
            <h1 className="text-2xl font-bold mb-8">🛒 จัดการคำสั่งซื้อ</h1>

            {orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-100">ยังไม่มีคำสั่งซื้อ</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-emerald-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800">รหัส</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800">ลูกค้า</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800">รายการ</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800">ยอด</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800">สถานะ</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800">วันที่</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o) => {
                                const status = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                                return (
                                    <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td onClick={() => setSelectedOrder(o)} className="px-5 py-3 font-bold text-emerald-700 cursor-pointer hover:underline">
                                            #{o.orderId || o.id.slice(0, 8)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium">{o.customer?.name || '-'}</div>
                                            <div className="text-xs text-gray-400">{o.customer?.phone}</div>
                                        </td>
                                        <td className="px-5 py-3">{(o.items || []).length} รายการ</td>
                                        <td className="px-5 py-3 font-semibold">{formatTHB(o.total)}</td>
                                        <td className="px-5 py-3">
                                            <select
                                                value={o.status}
                                                onChange={(e) => updateStatus(o.id, e.target.value)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold outline-none cursor-pointer border-0
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
                                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 🚨 Modal แสดงรายละเอียด + ดูสลิป */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-gray-800">รายละเอียดคำสั่งซื้อ</h2>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">✕</button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* ฝั่งซ้าย: ข้อมูลลูกค้า + รายการสินค้า */}
                            <div className="space-y-8">
                                <div className="bg-gray-50 p-6 rounded-3xl">
                                    <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-4 tracking-widest">📍 ที่อยู่จัดส่ง</h4>
                                    <p className="font-bold text-lg text-emerald-900">{selectedOrder.customer?.name}</p>
                                    <p className="text-sm text-gray-600 mb-2">📞 {selectedOrder.customer?.phone}</p>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {selectedOrder.customer?.address} <br/>
                                        ต. {selectedOrder.customer?.district} อ. {selectedOrder.customer?.amphoe} <br/>
                                        จ. {selectedOrder.customer?.province} {selectedOrder.customer?.zipcode}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-4 tracking-widest">🛒 รายการสินค้า</h4>
                                    <div className="space-y-3">
                                        {(selectedOrder.items || []).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 border-b border-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-lg">🥬</div>
                                                    <div>
                                                        <div className="font-bold text-sm">{item.name}</div>
                                                        <div className="text-[10px] text-gray-400">{formatTHB(item.price)} × {item.qty}</div>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-sm text-emerald-600">{formatTHB(item.price * item.qty)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ฝั่งขวา: สรุปราคา + ดูสลิป */}
                            <div className="space-y-6">
                                <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-xl shadow-emerald-100">
                                    <h4 className="font-bold text-emerald-400 uppercase text-[10px] mb-4 tracking-widest text-center">💰 สรุปยอดชำระ</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm opacity-80"><span>ราคารวม</span> <span>{formatTHB(selectedOrder.subtotal)}</span></div>
                                        <div className="flex justify-between text-sm opacity-80"><span>ค่าจัดส่ง</span> <span>{formatTHB(selectedOrder.shipping)}</span></div>
                                        <div className="flex justify-between text-xl font-black pt-3 border-t border-emerald-800"><span>ยอดสุทธิ</span> <span>{formatTHB(selectedOrder.total)}</span></div>
                                    </div>
                                </div>

{/* 📸 ส่วนแสดงสลิปการโอน (ฉบับแก้สัดส่วนรูป) */}
<div>
    <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-3 tracking-widest text-center">
        📸 หลักฐานการชำระเงิน
    </h4>
    {selectedOrder.slipUrl ? (
        <div className="rounded-3xl border-2 border-emerald-100 bg-gray-50 overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div 
                className="relative group cursor-zoom-in bg-white flex items-center justify-center p-2"
                style={{ minHeight: '300px', maxHeight: '500px' }} // 📏 คุมความสูงกรอบให้พอดี
                onClick={() => window.open(selectedOrder.slipUrl, '_blank')}
            >
                <img 
                    src={selectedOrder.slipUrl} 
                    alt="Payment Slip" 
                    className="max-w-full max-h-full object-contain rounded-xl" // ✨ contain เพื่อให้สัดส่วนสลิปไม่เพี้ยน
                />
                <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="bg-white/90 text-emerald-900 px-4 py-2 rounded-full font-bold text-xs shadow-lg backdrop-blur-sm">
                        🔍 คลิกเพื่อดูรูปใหญ่
                    </span>
                </div>
            </div>
            
            {selectedOrder.transRef && (
                <div className="p-3 bg-emerald-50 text-center text-[10px] font-bold text-emerald-700 border-t border-emerald-100">
                    REF ID: {selectedOrder.transRef}
                </div>
            )}
        </div>
    ) : (
        <div className="h-40 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <span className="text-2xl mb-2">⏳</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-center px-4">ยังไม่มีการแนบสลิป</p>
        </div>
    )}
</div>

                        <button 
                            onClick={() => setSelectedOrder(null)} 
                            className="w-full mt-10 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
