import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
    const { user } = useAuth();
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

    if (items.length === 0) {
        navigate('/cart');
        return null;
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // 🚨 แก้ไขจุดนี้: เติม async ไว้ข้างหน้า e => เพื่อให้ใช้ await บันทึก Firebase ได้
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const currentOrderId = generateOrderId();

        const orderData = {
            orderId: currentOrderId,
            userId: user?.uid || 'guest', 
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
            console.log("กำลังบันทึกข้อมูลไปที่ Firebase...");
            // 🚨 บรรทัดเจ้าปัญหาที่ทำให้ Build Failed เพราะไม่มี async ข้างบน
            await addDoc(collection(db, 'orders'), orderData);
            
            addToast('บันทึกคำสั่งซื้อเรียบร้อย', 'success');
            clearCart();

            if (paymentMethod === 'promptpay') {
                navigate('/test-payment', { 
                    state: { 
                        amount: total,
                        orderId: currentOrderId 
                    } 
                });
            } else {
                navigate('/orders');
            }

        } catch (err) {
            console.error('Firestore Error:', err.message);
            addToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold mb-2">💳 ชำระเงิน</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">กรอกข้อมูลเพื่อดำเนินการสั่งซื้อ</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5">📍 ข้อมูลจัดส่ง</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">ชื่อ-นามสกุล *</label>
                                    <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">เบอร์โทรศัพท์ *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-semibold mb-1.5">ที่อยู่ *</label>
                                <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white dark:bg-gray-900" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                <div><label className="block text-sm font-semibold mb-1.5">เขต/อำเภอ</label><input name="district" value={form.district} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200" /></div>
                                <div><label className="block text-sm font-semibold mb-1.5">จังหวัด</label><input name="province" value={form.province} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200" /></div>
                                <div><label className="block text-sm font-semibold mb-1.5">รหัสไปรษณีย์</label><input name="zipcode" value={form.zipcode} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200" /></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5">💰 วิธีชำระเงิน</h3>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
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

                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 h-fit lg:sticky lg:top-24">
                        <h3 className="font-bold text-lg mb-4">📋 สรุปคำสั่งซื้อ</h3>
                        <div className="flex justify-between font-bold text-base text-emerald-700 mb-6">
                            <span>ยอดรวมทั้งหมด</span>
                            <span>{formatTHB(total)}</span>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg disabled:opacity-50 transition-all">
                            {submitting ? 'กำลังดำเนินการ...' : `✅ สั่งซื้อสินค้า`}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
