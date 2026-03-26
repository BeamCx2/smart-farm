import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatTHB, generateOrderId, toSatang } from '../lib/utils';

// ✅ เปลี่ยนมาใช้ก้อนข้อมูลที่อยู่ไทยแบบ Simple (บอสไปเติมจังหวัดเพิ่มได้ครับ)
const THAI_ADDRESS = {
    "กรุงเทพมหานคร": ["จตุจักร", "บางกะปิ", "ดินแดง", "ลาดพร้าว", "พญาไท"],
    "เชียงใหม่": ["เมืองเชียงใหม่", "หางดง", "สารภี", "แม่ริม"],
    "ขอนแก่น": ["เมืองขอนแก่น", "บ้านไผ่", "ชุมแพ"],
    "ชลบุรี": ["เมืองชลบุรี", "ศรีราชา", "บางละมุง"]
};

const PAYMENT_METHODS = [
    { id: 'promptpay', label: '📱 PromptPay QR', desc: 'สแกนจ่ายผ่าน QR Code' },
    { id: 'bank', label: '🏦 โอนเงินผ่านธนาคาร', desc: 'โอนตรงเข้าบัญชี' },
];

export default function Checkout() {
    const { items, subtotal, shipping, total, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const [paymentMethod, setPaymentMethod] = useState('promptpay');
    const [submitting, setSubmitting] = useState(false);
    
    const [form, setForm] = useState({
        name: user?.displayName || '', 
        phone: '', 
        email: user?.email || '',
        address: '',    
        district: '',   
        province: '',   
        zipcode: '',    
    });

    if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const currentOrderId = generateOrderId();
        const batch = writeBatch(db);
        const newOrderRef = doc(collection(db, 'orders'));

        const orderData = {
            orderId: currentOrderId,
            userId: user.uid,
            customer: { ...form },
            items: items.map((i) => ({ 
                id: i.id, 
                name: i.name, 
                price: i.price, 
                qty: i.qty, 
                image: i.image || '' 
            })),
            subtotal, 
            shipping, 
            total,
            totalSatang: toSatang(total),
            paymentMethod, 
            status: 'pending',
            createdAt: serverTimestamp(),
        };

        try {
            batch.set(newOrderRef, orderData);
            items.forEach((item) => {
                const productRef = doc(db, 'products', item.id);
                batch.update(productRef, { stock: increment(-item.qty) });
            });

            await batch.commit();
            addToast('สั่งซื้อเรียบร้อย', 'success');
            clearCart();
            navigate('/payment', { 
                state: { amount: total, orderId: currentOrderId, firebaseId: newOrderRef.id } 
            });
        } catch (err) {
            addToast('ล้มเหลว: ' + err.message, 'error');
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold mb-2 text-emerald-900">💳 ชำระเงิน</h1>
            <p className="text-gray-500 mb-8 font-medium">ระบุที่อยู่จัดส่งสินค้าจากฟาร์ม</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5 flex items-center gap-2 text-emerald-700">📍 ข้อมูลจัดส่ง</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">ชื่อ-นามสกุล *</label>
                                    <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm" placeholder="สมชาย ใจดี" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">เบอร์โทรศัพท์ *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm" placeholder="081-234-5678" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-semibold mb-1.5">ที่อยู่ (บ้านเลขที่, ซอย, ถนน) *</label>
                                <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm" placeholder="123/4 ม.5" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                {/* 🔴 จังหวัด Select */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">จังหวัด *</label>
                                    <select name="province" value={form.province} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-emerald-400 outline-none text-sm">
                                        <option value="">เลือกจังหวัด</option>
                                        {Object.keys(THAI_ADDRESS).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                {/* 🔴 เขต/อำเภอ Select */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">เขต/อำเภอ *</label>
                                    <select name="district" value={form.district} onChange={handleChange} required disabled={!form.province} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-emerald-400 outline-none text-sm disabled:bg-gray-50">
                                        <option value="">เลือกเขต/อำเภอ</option>
                                        {form.province && THAI_ADDRESS[form.province].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                {/* 🔴 รหัสไปรษณีย์ Input */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">รหัสไปรษณีย์ *</label>
                                    <input name="zipcode" value={form.zipcode} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm" placeholder="10900" />
                                </div>
                            </div>
                        </div>

                        {/* วิธีชำระเงิน */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5 flex items-center gap-2 text-emerald-700">💰 วิธีชำระเงิน</h3>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                                        <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-emerald-600 w-4 h-4" />
                                        <div>
                                            <div className="font-semibold text-sm">{m.label}</div>
                                            <div className="text-xs text-gray-500">{m.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-md border border-gray-100 h-fit lg:sticky lg:top-24">
                        <h3 className="font-bold text-lg mb-4 text-emerald-900">📋 สรุปรายการ</h3>
                        <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-2">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-3 items-center">
                                    <img src={item.image || 'https://placehold.co/50'} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold truncate">{item.name}</div>
                                        <div className="text-xs text-gray-400">จำนวน {item.qty} ชิ้น</div>
                                    </div>
                                    <div className="text-sm font-black text-emerald-700">{formatTHB(item.price * item.qty)}</div>
                                </div>
                            ))}
                        </div>
                        <hr className="border-gray-100 my-4" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-500"><span>รวมค่าสินค้า</span><span>{formatTHB(subtotal)}</span></div>
                            <div className="flex justify-between text-gray-500"><span>ค่าจัดส่ง</span><span>{shipping === 0 ? <span className="text-emerald-600">ฟรี</span> : formatTHB(shipping)}</span></div>
                            <hr className="border-gray-100" />
                            <div className="flex justify-between text-lg font-black pt-1 text-emerald-900"><span>ยอดสุทธิ</span><span>{formatTHB(total)}</span></div>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full mt-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-200 transition-all disabled:opacity-50">
                            {submitting ? 'กำลังส่งข้อมูล...' : `✅ ยืนยันการสั่งซื้อ`}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
