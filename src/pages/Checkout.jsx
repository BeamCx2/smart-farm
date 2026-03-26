import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatTHB, generateOrderId, toSatang } from '../lib/utils';

const PAYMENT_METHODS = [
    { id: 'promptpay', label: '📱 PromptPay QR', desc: 'สแกนจ่ายผ่าน QR Code' },
    { id: 'bank', label: '🏦 โอนเงินผ่านธนาคาร', desc: 'โอนตรงเข้าบัญชี' },
];

export default function Checkout() {
    const { items, subtotal, shipping, total, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('promptpay');
    
    const [form, setForm] = useState({
        name: user?.displayName || '', 
        phone: '', 
        email: user?.email || '',
        address: '',    // บ้านเลขที่, ซอย, ถนน
        district: '',   // ตำบล
        amphoe: '',     // อำเภอ
        province: '',   // จังหวัด
        zipcode: '',    // รหัสไปรษณีย์
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

        try {
            batch.set(newOrderRef, {
                orderId: currentOrderId,
                userId: user.uid,
                customer: { ...form },
                items: items.map(i => ({ 
                    id: i.id, 
                    name: i.name, 
                    price: i.price, 
                    qty: i.qty, 
                    image: i.image || '' 
                })),
                subtotal, shipping, total,
                totalSatang: toSatang(total),
                paymentMethod, 
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            items.forEach(item => {
                const productRef = doc(db, 'products', item.id);
                batch.update(productRef, { stock: increment(-item.qty) });
            });

            await batch.commit();
            addToast('สั่งซื้อเรียบร้อย', 'success');
            clearCart();
            navigate('/payment', { state: { amount: total, orderId: currentOrderId, firebaseId: newOrderRef.id } });
        } catch (err) {
            addToast('ล้มเหลว: ' + err.message, 'error');
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 py-10 font-sans text-left">
            <h1 className="text-2xl font-bold mb-2 text-emerald-900">💳 ชำระเงิน</h1>
            <p className="text-gray-500 mb-8 font-medium">ระบุที่อยู่จัดส่งสินค้าจากฟาร์ม</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* 🏠 ข้อมูลจัดส่ง */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                            <h3 className="font-bold mb-6 flex items-center gap-2 text-emerald-700 text-lg">📍 ข้อมูลจัดส่ง</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">ชื่อ-นามสกุล *</label>
                                    <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none focus:border-emerald-400 focus:bg-white transition-all bg-gray-50/30" placeholder="สมชาย ใจดี" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">เบอร์โทรศัพท์ *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none focus:border-emerald-400 focus:bg-white transition-all bg-gray-50/30" placeholder="081-234-5678" />
                                </div>
                            </div>

                            <div className="mt-5">
                                <label className="block text-sm font-semibold mb-2 text-gray-700">ที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน) *</label>
                                <textarea name="address" value={form.address} onChange={handleChange} required rows="2" className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none focus:border-emerald-400 focus:bg-white transition-all bg-gray-50/30" placeholder="123/4 หมู่ 5 ซอยรื่นรมย์..." />
                            </div>

                            <div className="grid grid-cols-2 gap-5 mt-5">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">ตำบล / แขวง *</label>
                                    <input name="district" value={form.district} onChange={handleChange} required className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none focus:border-emerald-400 focus:bg-white transition-all bg-gray-50/30" placeholder="ลาดยาว" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">อำเภอ / เขต *</label>
                                    <input name="amphoe" value={form.amphoe} onChange={handleChange} required className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none focus:border-emerald-400 focus:bg-white transition-all bg-gray-50/30" placeholder="จตุจักร" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5 mt-5">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">จังหวัด *</label>
                                    <input name="province" value={form.province} onChange={handleChange} required className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none focus:border-emerald-400 focus:bg-white transition-all bg-gray-50/30" placeholder="กรุงเทพมหานคร" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">รหัสไปรษณีย์ *</label>
                                    <input name="zipcode" value={form.zipcode} onChange={handleChange} required className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none focus:border-emerald-400 focus:bg-white transition-all bg-gray-50/30" placeholder="10900" />
                                </div>
                            </div>
                        </div>

                        {/* 💰 วิธีชำระเงิน */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                            <h3 className="font-bold mb-6 text-emerald-700 text-lg">💰 วิธีชำระเงิน</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 hover:border-emerald-200'}`}>
                                        <input type="radio" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-emerald-600 w-5 h-5" />
                                        <div>
                                            <div className="font-bold text-sm text-gray-800">{m.label}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* สรุปรายการ */}
                    <div className="bg-white rounded-3xl p-8 shadow-lg shadow-emerald-100/50 h-fit lg:sticky lg:top-24 border border-emerald-50">
                        <h3 className="font-bold text-xl mb-6 text-emerald-900 border-b border-gray-100 pb-4">📋 สรุปรายการ</h3>
                        
                        <div className="flex justify-between items-center text-lg font-black text-emerald-900 mb-8">
                            <span>ยอดสุทธิ</span>
                            <span className="text-2xl">{formatTHB(total)}</span>
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
                        >
                            {submitting ? 'กำลังส่งข้อมูล...' : `✅ ยืนยันการสั่งซื้อ`}
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-4 font-medium italic">
                            * ตรวจสอบที่อยู่จัดส่งให้ถูกต้องก่อนยืนยัน
                        </p>
                    </div>
                </div>
            </form>
        </section>
    );
}
