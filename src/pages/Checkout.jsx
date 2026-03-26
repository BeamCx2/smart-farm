import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore'; // ✅ เพิ่ม writeBatch, doc, increment
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

    if (items.length === 0 && !submitting) {
        return <Navigate to="/cart" replace />;
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const currentOrderId = generateOrderId();
        const amountToPay = total;

        // 🚨 1. สร้าง Batch เพื่อทำงานหลายอย่างพร้อมกัน (Atomic Operation)
        const batch = writeBatch(db);

        // 2. เตรียม Reference สำหรับออเดอร์ใหม่
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
            total: amountToPay,
            totalSatang: toSatang(amountToPay),
            paymentMethod, 
            status: 'pending',
            createdAt: serverTimestamp(),
        };

        try {
            // 3. สั่งเพิ่มออเดอร์ลงใน Batch
            batch.set(newOrderRef, orderData);

            // 4. สั่งตัดสต๊อกสินค้าแต่ละชิ้นใน Batch
            items.forEach((item) => {
                const productRef = doc(db, 'products', item.id);
                batch.update(productRef, {
                    stock: increment(-item.qty) // ✅ ลดจำนวนสต๊อกตามที่ซื้อจริง
                });
            });

            // 5. บันทึกข้อมูลทั้งหมดลงฐานข้อมูล (ถ้าอันไหนพังจะยกเลิกทั้งหมด)
            await batch.commit();

            addToast('สั่งซื้อและตัดสต๊อกเรียบร้อย', 'success');
            clearCart();

navigate('/payment', { 
    state: { 
        amount: amountToPay, 
        orderId: currentOrderId,
        firebaseDocId: newOrderRef.id 
    } 
});
            } else {
                navigate('/orders');
            }

        } catch (err) {
            console.error('Checkout Error:', err.message);
            addToast('การสั่งซื้อล้มเหลว: ' + err.message, 'error');
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            {/* ... JSX ส่วนที่เหลือของบอสเหมือนเดิมทุกอย่างครับ ... */}
            <h1 className="text-2xl font-bold mb-2">💳 ชำระเงิน</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">กรอกข้อมูลเพื่อดำเนินการสั่งซื้อ</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left — Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5">📍 ข้อมูลจัดส่ง</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">ชื่อ-นามสกุล *</label>
                                    <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="สมชาย ใจดี" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">เบอร์โทรศัพท์ *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="081-234-5678" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-semibold mb-1.5">อีเมล *</label>
                                <input name="email" value={form.email} onChange={handleChange} required type="email" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="you@example.com" />
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-semibold mb-1.5">ที่อยู่ *</label>
                                <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="123/45 ซ.สุขใจ ถ.เกษตร" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">เขต/อำเภอ *</label>
                                    <input name="district" value={form.district} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="จตุจักร" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">จังหวัด *</label>
                                    <input name="province" value={form.province} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="กรุงเทพฯ" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">รหัสไปรษณีย์ *</label>
                                    <input name="zipcode" value={form.zipcode} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="10900" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5">💰 วิธีชำระเงิน</h3>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'}`}>
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

                    {/* Right — Summary */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 h-fit lg:sticky lg:top-24">
                        <h3 className="font-bold text-lg mb-4">📋 สรุปคำสั่งซื้อ</h3>
                        <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-3 items-center">
                                    <img src={item.image || 'https://placehold.co/50x50/e8f5e9/2e7d32?text=P'} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{item.name}</div>
                                        <div className="text-xs text-gray-500">x{item.qty}</div>
                                    </div>
                                    <div className="text-sm font-semibold shrink-0">{formatTHB(item.price * item.qty)}</div>
                                </div>
                            ))}
                        </div>
                        <hr className="border-gray-200 dark:border-gray-700 my-4" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">ราคารวม</span><span>{formatTHB(subtotal)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">ค่าจัดส่ง</span><span>{shipping === 0 ? <span className="text-emerald-600 font-semibold">ฟรี</span> : formatTHB(shipping)}</span></div>
                            <hr className="border-gray-200 dark:border-gray-700" />
                            <div className="flex justify-between text-base font-bold pt-1"><span>ยอดรวม</span><span className="text-emerald-700 dark:text-emerald-400">{formatTHB(total)}</span></div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full mt-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'กำลังดำเนินการ...' : `✅ สั่งซื้อ — ${formatTHB(total)}`}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
