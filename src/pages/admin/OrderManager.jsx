import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, getBytes } from 'firebase/storage';
import { formatTHB, ORDER_STATUSES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

export default function OrderManager() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [trackingNum, setTrackingNum] = useState('');
    const [slipImageData, setSlipImageData] = useState(null);
    const { addToast } = useToast();

    // ✅ ดึงรูปภาพสลิปจาก Firebase Storage ด้วย real-time signing
    const loadSlipImage = async (slipPath) => {
        if (!slipPath) return null;
        try {
            const fileRef = ref(storage, slipPath);
            const bytes = await getBytes(fileRef);
            const blob = new Blob([bytes], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            return url;
        } catch (error) {
            console.error('❌ Failed to load slip image:', error);
            return null;
        }
    };

    const load = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
            setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch { setOrders([]); }
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, []);

    // ✅ เมื่อเลือก order จะดึงรูปภาพสลิป
    useEffect(() => {
        if (selectedOrder && selectedOrder.slipPath) {
            loadSlipImage(selectedOrder.slipPath).then(url => setSlipImageData(url));
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSlipImageData(null);
        }
    }, [selectedOrder]);

    const updateStatus = async (orderId, newStatus, tracking = '') => {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'shipped' && tracking) updateData.trackingNumber = tracking;
            await updateDoc(doc(db, 'orders', orderId), updateData);
            addToast('อัปเดตสถานะสำเร็จ', 'success');

            // ✅ Reload ข้อมูล order ให้ latest เพื่อแสดง slipUrl ที่อัปเดท
            const updatedSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
            const updatedOrders = updatedSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setOrders(updatedOrders);

            // ✅ Update selectedOrder ให้แสดง slipUrl ที่เพิ่งอัปเดท
            const updated = updatedOrders.find(o => o.id === orderId);
            if (updated) setSelectedOrder(updated);
            else setSelectedOrder(null);
        } catch (e) { addToast('ผิดพลาด: ' + e.message, 'error'); }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="p-4 sm:p-8 font-sans transition-colors duration-300">
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-8 uppercase tracking-tighter">📦 Order Management</h1>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">ID</th>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Customer</th>
                                <th className="px-6 py-4 text-center font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-4 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {orders.map((o) => (
                                <tr key={o.id} onClick={() => { setSelectedOrder(o); setTrackingNum(o.trackingNumber || ''); }} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-500/10 cursor-pointer transition-colors">
                                    <td className="px-6 py-5 font-bold text-emerald-600 dark:text-emerald-400">#{o.orderId || o.id.slice(0, 8)}</td>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-gray-800 dark:text-gray-200">{o.customer?.name}</div>
                                        <div className="text-xs text-gray-400">{o.customer?.phone}</div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                            {ORDER_STATUSES[o.status]?.label || o.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-gray-900 dark:text-gray-100">{formatTHB(o.total || o.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Sync Dark/Light Mode */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-in fade-in duration-200">
                    {/* เปลี่ยนสีพื้นหลังตามโหมด (bg-gray-800 / bg-gray-100) */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden border border-gray-200 dark:border-gray-700">

                        <div className="p-8 flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">รายละเอียดคำสั่งซื้อ</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">#{selectedOrder.orderId || selectedOrder.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-white/20 dark:bg-black/20 rounded-full text-gray-800 dark:text-white hover:bg-red-500 transition-all flex items-center justify-center">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                {/* คอลัมน์ซ้าย: ข้อมูลลูกค้าและสินค้า */}
                                <div className="lg:col-span-5 space-y-4">
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-3 flex items-center gap-2">👤 ข้อมูลลูกค้า</h3>
                                        <p className="text-gray-900 dark:text-white font-bold text-lg">{selectedOrder.customer?.name}</p>
                                        <p className="text-emerald-600 dark:text-emerald-400 font-bold mb-3">📞 {selectedOrder.customer?.phone}</p>
                                        <div className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                                            <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">ที่อยู่จัดส่ง:</p>
                                            <p>{selectedOrder.customer?.address} ต.{selectedOrder.customer?.subDistrict} อ.{selectedOrder.customer?.district} จ.{selectedOrder.customer?.province} {selectedOrder.customer?.zipcode}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-3 flex items-center gap-2">🛒 รายการสินค้า</h3>
                                        <div className="space-y-2">
                                            {(selectedOrder.items || []).map((item, i) => (
                                                <div key={i} className="flex justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                                    <div className="text-gray-800 dark:text-gray-200 text-xs">
                                                        <p className="font-bold">{item.name}</p>
                                                        <p className="text-emerald-600 dark:text-emerald-400 font-black">จำนวน: {item.qty}</p>
                                                    </div>
                                                    <p className="font-black text-gray-900 dark:text-white text-xs">{formatTHB(item.price * item.qty)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* คอลัมน์ขวา: สลิป และ อัปเดตสถานะ */}
                                <div className="lg:col-span-7 space-y-4">
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                                        <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">ยอดรวมทั้งสิ้น</p>
                                        <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-4">{formatTHB(selectedOrder.total || selectedOrder.amount)}</p>

                                        <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-3 self-start text-xs">💳 สลิปการชำระเงิน</h3>
                                        {/* ล็อกขนาดสลิปเพื่อไม่ให้บังส่วนล่าง */}
                                        <div className="w-full max-w-[340px] aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center relative">
                                            {slipImageData ? (
                                                <img
                                                    src={slipImageData}
                                                    className="w-full h-full object-contain"
                                                    alt="Payment Slip"
                                                />
                                            ) : selectedOrder.slipUrl && selectedOrder.slipUrl.trim() ? (
                                                <div className="text-center p-4">
                                                    <p className="text-gray-400 text-xs font-bold mb-2">📥 ดึงรูปภาพจาก Firebase Storage...</p>
                                                    <p className="text-gray-300 text-[10px] break-all">{selectedOrder.slipUrl.slice(0, 100)}...</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-gray-400 text-xs italic">ยังไม่มีการแนบสลิป</p>
                                                    <p className="text-gray-300 text-[10px] mt-2">สถานะ: {selectedOrder.status}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ปุ่มอัปเดตสถานะ - เรียง Grid ให้กดยานขึ้นตามภาพ */}
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-4 text-xs">⚙️ อัปเดตสถานะ</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => key !== 'shipped' ? updateStatus(selectedOrder.id, key) : setSelectedOrder({ ...selectedOrder, status: 'shipped' })}
                                                    className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${selectedOrder.status === key
                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {val.label}
                                                </button>
                                            ))}
                                        </div>

                                        {selectedOrder.status === 'shipped' && (
                                            <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2">
                                                <input type="text" value={trackingNum} onChange={(e) => setTrackingNum(e.target.value)} className="flex-1 px-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 outline-none focus:ring-1 ring-emerald-500" placeholder="เลขติดตามพัสดุ..." />
                                                <button onClick={() => updateStatus(selectedOrder.id, 'shipped', trackingNum)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase shadow-md">บันทึก</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ปุ่มปิดด้านล่าง Sync สีตามโหมด */}
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={() => setSelectedOrder(null)} className="w-full py-4 font-black uppercase text-gray-800 dark:text-gray-200 tracking-widest text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">ปิดรายละเอียด</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}