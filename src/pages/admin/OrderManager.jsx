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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-gray-900 dark:to-emerald-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-xl animate-float"></div>
                    <div className="absolute top-40 right-20 w-24 h-24 bg-amber-200/40 rounded-full blur-lg animate-float" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-emerald-300/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
                </div>
                <div className="text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
                        <span className="text-2xl">🛒</span>
                    </div>
                    <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-16 left-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-36 right-16 w-28 h-28 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-28 left-1/4 w-44 h-44 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 right-10 w-24 h-24 bg-slate-700/40 rounded-full blur-md animate-float" style={{ animationDelay: '0.5s' }}></div>
            </div>

            <div className="relative z-10 p-4 sm:p-8">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in-up">
                    <div className="w-20 h-20 bg-slate-800/80 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/10 animate-float">
                        <span className="text-3xl">🛒</span>
                    </div>
                    <h1 className="text-4xl font-black text-emerald-300 mb-4">จัดการคำสั่งซื้อ</h1>
                    <p className="text-slate-400 text-lg">ติดตามและจัดการคำสั่งซื้อทั้งหมดของร้านค้า</p>
                </div>

                {/* Orders Table */}
                <div className="glass rounded-3xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in-up mb-8 border border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-slate-200">
                            <thead className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">รหัสคำสั่งซื้อ</th>
                                    <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">ลูกค้า</th>
                                    <th className="px-6 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">สถานะ</th>
                                    <th className="px-6 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">วันที่</th>
                                    <th className="px-6 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">ยอดรวม</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {orders.map((o, index) => {
                                    const statusCfg = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
                                    return (
                                        <tr
                                            key={o.id}
                                            onClick={() => { setSelectedOrder(o); setTrackingNum(o.trackingNumber || ''); }}
                                            className="hover:bg-white/10 transition-all duration-200 cursor-pointer group animate-fade-in-up"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <td className="px-6 py-6 text-left">
                                                <div className="text-emerald-300 font-bold hover:text-emerald-200 transition-colors">
                                                    #{o.orderId || o.id.slice(0, 8)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-left">
                                                <div className="text-slate-100 font-semibold">{o.customer?.name}</div>
                                                <div className="text-slate-400 text-sm">{o.customer?.phone}</div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg
                                                    ${statusCfg.color === 'green' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                                                      statusCfg.color === 'yellow' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' :
                                                      statusCfg.color === 'blue' ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' :
                                                      'bg-red-500/20 text-red-600 border border-red-500/30'}`}>
                                                    {statusCfg.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center text-gray-600 dark:text-gray-400 text-sm">
                                                {formatDateTime(o.createdAt)}
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="text-emerald-300 font-black text-lg">
                                                    {formatTHB(o.total || o.amount)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Order Detail Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 z-[999] animate-in fade-in scale-in-center">
                        <div className="glass dark rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-black/70 overflow-hidden border border-slate-700">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-4xl font-black text-emerald-300 mb-2">รายละเอียดคำสั่งซื้อ</h2>
                                    <p className="text-slate-400">#{selectedOrder.orderId || selectedOrder.id.slice(0, 8)}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all hover:scale-110"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden flex-1">
                                {/* Left Column - Customer & Items */}
                                <div className="lg:col-span-5 space-y-6 overflow-y-auto custom-scrollbar">
                                    {/* Customer Info */}
                                    <div className="glass dark rounded-2xl p-6 border border-slate-700">
                                        <h4 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                                            <span className="text-xl">👤</span>
                                            ข้อมูลลูกค้า
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-2xl font-bold text-slate-100">{selectedOrder.customer?.name}</p>
                                                <p className="text-emerald-400 font-medium">📞 {selectedOrder.customer?.phone}</p>
                                            </div>
                                            <div className="text-slate-400 text-sm leading-relaxed">
                                                <p className="font-semibold text-slate-100 mb-1">ที่อยู่จัดส่ง:</p>
                                                <p>{selectedOrder.customer?.address}</p>
                                                <p>ต.{selectedOrder.customer?.subDistrict} อ.{selectedOrder.customer?.district}</p>
                                                <p>จ.{selectedOrder.customer?.province} {selectedOrder.customer?.zipcode}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="glass dark rounded-2xl p-6 border border-slate-700">
                                        <h4 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                                            <span className="text-xl">🛒</span>
                                            รายการสินค้า
                                        </h4>
                                        <div className="space-y-3">
                                            {(selectedOrder.items || []).map((item, i) => (
                                                <div key={i} className="flex justify-between items-center p-4 bg-slate-900/80 rounded-xl border border-slate-700">
                                                    <div>
                                                        <p className="text-slate-100 font-medium">{item.name}</p>
                                                        <p className="text-emerald-400 text-sm">จำนวน: {item.qty}</p>
                                                    </div>
                                                    <p className="text-slate-100 font-bold">{formatTHB(item.price * item.qty)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Payment & Status */}
                                <div className="lg:col-span-7 flex flex-col space-y-6">
                                    {/* Total Amount */}
                                    <div className="glass dark rounded-2xl p-8 border border-slate-700 text-center bg-slate-900/90">
                                        <p className="text-sm text-slate-400 uppercase tracking-widest mb-2">ยอดรวมทั้งสิ้น</p>
                                        <p className="text-4xl font-black text-emerald-300">{formatTHB(selectedOrder.total || selectedOrder.amount)}</p>
                                    </div>

                                    {/* Payment Slip */}
                                    <div className="glass dark rounded-2xl p-6 flex-1 border border-slate-700">
                                        <h4 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                                            <span className="text-xl">💳</span>
                                            สลิปการชำระเงิน
                                        </h4>
                                        <div className="bg-slate-900/80 rounded-3xl overflow-hidden min-h-[240px] flex items-center justify-center border border-slate-800 shadow-inner">
                                            {selectedOrder.slipUrl ? (
                                                <img
                                                    src={selectedOrder.slipUrl}
                                                    alt="Payment Slip"
                                                    className="max-w-full max-h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={() => window.open(selectedOrder.slipUrl, '_blank')}
                                                />
                                            ) : (
                                                <div className="text-center text-slate-400">
                                                    <div className="text-4xl mb-2">📄</div>
                                                    <p>รอการอัปโหลดสลิป</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Update */}
                                    <div className="glass dark rounded-2xl p-6 border border-slate-700">
                                        <h4 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                                            <span className="text-xl">⚙️</span>
                                            อัปเดตสถานะ
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                            {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => {
                                                        if (key !== 'shipped') updateStatus(selectedOrder.id, key);
                                                        else setSelectedOrder({...selectedOrder, status: 'shipped'});
                                                    }}
                                                    className={`py-3 px-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all transform
                                                        ${selectedOrder.status === key
                                                            ? 'bg-emerald-500 text-slate-950 shadow-2xl shadow-emerald-500/30'
                                                            : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:bg-slate-800'}`}
                                                >
                                                    {val.label}
                                                </button>
                                            ))}
                                        </div>

                                        {selectedOrder.status === 'shipped' && (
                                            <div className="flex gap-3 animate-fade-in-up">
                                                <input
                                                    type="text"
                                                    value={trackingNum}
                                                    onChange={(e) => setTrackingNum(e.target.value)}
                                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:border-emerald-400 outline-none transition-all"
                                                    placeholder="หมายเลขติดตามพัสดุ..."
                                                />
                                                <button
                                                    onClick={() => updateStatus(selectedOrder.id, 'shipped', trackingNum)}
                                                    className="px-6 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-2xl shadow-emerald-500/25 transition-all hover:-translate-y-1"
                                                >
                                                    บันทึก
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-700">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="w-full py-4 bg-slate-900 text-slate-100 font-bold rounded-xl border border-slate-700 shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-1"
                                >
                                    ปิดรายละเอียด
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
