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
            <h1 className="text-2xl font-bold mb-8 text-emerald-900">🛒 จัดการคำสั่งซื้อ</h1>

            {orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center text-gray-500 border border-gray-100 shadow-sm">ยังไม่มีคำสั่งซื้อ</div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-emerald-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-emerald-800">รหัส</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-emerald-800">ลูกค้า</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-emerald-800">รายการ</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-emerald-800">ยอดสุทธิ</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-emerald-800">สถานะ</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-emerald-800">วันที่สั่งซื้อ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((o) => {
                                const status = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                                return (
                                    <tr key={o.id} className="hover:bg-emerald-50/20 transition-colors">
                                        <td onClick={() => setSelectedOrder(o)} className="px-6 py-4 font-bold text-emerald-600 cursor-pointer hover:underline">
                                            #{o.orderId || o.id.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{o.customer?.name || '-'}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">{o.customer?.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">{(o.items || []).length} รายการ</td>
                                        <td className="px-6 py-4 font-black text-gray-900">{formatTHB(o.total)}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={o.status}
                                                onChange={(e) => updateStatus(o.id, e.target.value)}
                                                className={`px-4 py-1.5 rounded-full text-[10px] font-black outline-none cursor-pointer border-0 transition-all
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
                                        <td className="px-6 py-4 text-gray-400 text-xs font-medium">{formatDateTime(o.createdAt)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 🚨 Modal รายละเอียด (Fix ปีกกาและสัดส่วนสลิป) */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-6">
                            <h2 className="text-2xl font-black text-gray-800">รายละเอียดคำสั่งซื้อ</h2>
                            <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-gray-100 rounded-full transition-all text-xl">✕</button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* ฝั่งซ้าย: ข้อมูลลูกค้า */}
                            <div className="space-y-8">
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                    <h4 className="font-black text-gray-400 uppercase text-[10px] mb-4 tracking-widest">📍 ที่อยู่จัดส่ง</h4>
                                    <p className="font-black text-xl text-emerald-900 mb-1">{selectedOrder.customer?.name}</p>
                                    <p className="text-sm font-bold text-gray-600 mb-3">📞 {selectedOrder.customer?.phone}</p>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        {selectedOrder.customer?.address} <br/>
                                        ต. {selectedOrder.customer?.district} อ. {selectedOrder.customer?.amphoe} <br/>
                                        จ. {selectedOrder.customer?.province} {selectedOrder.customer?.zipcode}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-black text-gray-400 uppercase text-[10px] mb-4 tracking-widest">🛒 รายการสินค้า</h4>
                                    <div className="space-y-3">
                                        {(selectedOrder.items || []).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-lg shadow-sm">🥬</div>
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-800">{item.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{formatTHB(item.price)} × {item.qty}</div>
                                                    </div>
                                                </div>
                                                <span className="font-black text-sm text-emerald-600">{formatTHB(item.price * item.qty)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ฝั่งขวา: สรุปยอด + ดูสลิป (ฉบับแก้กรอบสลิปพอดี) */}
                            <div className="space-y-6">
                                <div className="bg-emerald-900 text-white p-7 rounded-[2rem] shadow-xl shadow-emerald-100">
                                    <h4 className="font-black text-emerald-400 uppercase text-[10px] mb-4 tracking-widest text-center">💰 สรุปยอดชำระ</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm font-medium opacity-80"><span>ราคารวม</span> <span>{formatTHB(selectedOrder.subtotal)}</span></div>
                                        <div className="flex justify-between text-sm font-medium opacity-80"><span>ค่าจัดส่ง</span> <span>{formatTHB(selectedOrder.shipping)}</span></div>
                                        <div className="flex justify-between text-2xl font-black pt-4 border-t border-emerald-800 mt-2"><span>ยอดสุทธิ</span> <span>{formatTHB(selectedOrder.total)}</span></div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-black text-gray-400 uppercase text-[10px] mb-4 tracking-widest text-center">📸 หลักฐานการชำระเงิน</h4>
                                    {selectedOrder.slipUrl ? (
                                        <div className="rounded-[2rem] border-2 border-emerald-100 bg-gray-50 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                            <div 
                                                className="relative group cursor-zoom-in bg-white flex items-center justify-center p-2"
                                                style={{ minHeight: '320px', maxHeight: '500px' }}
                                                onClick={() => window.open(selectedOrder.slipUrl, '_blank')}
                                            >
                                                <img 
                                                    src={selectedOrder.slipUrl} 
                                                    alt="Payment Slip" 
                                                    className="max-w-full max-h-[480px] object-contain rounded-xl"
                                                />
                                                <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                    <span className="bg-white/95 text-emerald-900 px-5 py-2.5 rounded-full font-black text-xs shadow-2xl backdrop-blur-sm">🔍 ดูรูปใหญ่</span>
                                                </div>
                                            </div>
                                            {selectedOrder.transRef && (
                                                <div className="p-4 bg-emerald-50 text-center text-[10px] font-black text-emerald-700 border-t border-emerald-100 tracking-tighter uppercase">
                                                    Reference ID: {selectedOrder.transRef}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-48 rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                            <span className="text-3xl mb-3">⏳</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest">รอดำเนินการแนบสลิป</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedOrder(null)} 
                            className="w-full mt-10 py-5 bg-gray-900 hover:bg-black text-white font-black text-lg rounded-2xl transition-all shadow-xl active:scale-[0.98]"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
