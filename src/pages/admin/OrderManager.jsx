import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, formatDateTime, ORDER_STATUSES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

export default function OrderManager() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null); // 🚨 ตัวแปรสำหรับเก็บออเดอร์ที่ถูกคลิกดู
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
        <div className="relative">
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
                                        {/* 🚨 เมื่อคลิกรหัส จะเปิดหน้าต่างดูข้อมูลออเดอร์ */}
                                        <td 
                                            onClick={() => setSelectedOrder(o)}
                                            className="px-5 py-3 font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap cursor-pointer hover:underline"
                                        >
                                            #{o.orderId || o.id.slice(0, 8)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium">{o.customer?.name || '-'}</div>
                                            <div className="text-xs text-gray-400">{o.customer?.phone}</div>
                                        </td>
                                        <td className="px-5 py-3">{(o.items || []).length} รายการ</td>
                                        <td className="px-5 py-3 font-semibold">{formatTHB(o.total)}</td>
                                        <td className="px-5 py-3 text-xs uppercase text-gray-400 font-bold">
                                            {o.paymentMethod || 'QR'}
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

            {/* 🚨 Modal แสดงรายละเอียดคำสั่งซื้อ (About Information) */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">รายละเอียดคำสั่งซื้อ</h2>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-2xl">✕</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl">
                                <h4 className="font-bold text-gray-400 uppercase text-xs mb-3 tracking-widest">📍 ที่อยู่จัดส่ง</h4>
                                <p className="font-bold text-lg mb-1">{selectedOrder.customer?.name}</p>
                                <p className="text-sm mb-1">📞 {selectedOrder.customer?.phone}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {selectedOrder.customer?.address} <br/>
                                    ต. {selectedOrder.customer?.district} อ. {selectedOrder.customer?.province} <br/>
                                    รหัสไปรษณีย์: {selectedOrder.customer?.zipcode}
                                </p>
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className="font-bold text-gray-400 uppercase text-xs mb-3 tracking-widest">💰 สรุปการชำระเงิน</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm"><span>วิธีชำระ:</span> <span className="font-bold uppercase">{selectedOrder.paymentMethod}</span></div>
                                    <div className="flex justify-between text-sm"><span>ราคารวม:</span> <span>{formatTHB(selectedOrder.subtotal)}</span></div>
                                    <div className="flex justify-between text-sm"><span>ค่าจัดส่ง:</span> <span>{formatTHB(selectedOrder.shipping)}</span></div>
                                    <div className="flex justify-between text-lg font-bold text-emerald-600 border-t pt-2"><span>ยอดสุทธิ:</span> <span>{formatTHB(selectedOrder.total)}</span></div>
                                </div>
                            </div>
                        </div>

                        <h4 className="font-bold text-gray-400 uppercase text-xs mb-4 tracking-widest text-center">🛒 รายการสินค้าในตะกร้า</h4>
                        <div className="space-y-3">
                            {(selectedOrder.items || []).map((item, i) => (
                                <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">🥬</div>
                                        <div>
                                            <div className="font-bold text-sm">{item.name}</div>
                                            <div className="text-xs text-gray-400">{formatTHB(item.price)} × {item.qty}</div>
                                        </div>
                                    </div>
                                    <span className="font-bold text-emerald-600">{formatTHB(item.price * item.qty)}</span>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => setSelectedOrder(null)}
                            className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
