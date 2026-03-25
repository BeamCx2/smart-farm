import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (items.length === 0) {
        return <Navigate to="/cart" replace />;
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const currentOrderId = generateOrderId();
        // 🚨 1. เก็บค่ายอดเงินปัจจุบันไว้ในตัวแปรก่อน (ห้ามใช้ total ตรงๆ หลังจากเคลียร์ตะกร้า)
        const amountToPay = total; 

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
            total: amountToPay, // ใช้ค่าที่เราเก็บไว้
            totalSatang: toSatang(amountToPay),
            paymentMethod,
            status: 'pending',
            createdAt: serverTimestamp(),
        };

        try {
            console.log("🚀 กำลังบันทึกออเดอร์...");
            // 2. บันทึกลง Firebase
            const docRef = await addDoc(collection(db, 'orders'), orderData);
            
            console.log("✅ บันทึกสำเร็จ! กำลังไปหน้าชำระเงินด้วยยอด:", amountToPay);
            addToast('บันทึกคำสั่งซื้อเรียบร้อย', 'success');
            
            // 3. 🚨 เคลียร์ตะกร้า "หลังจาก" บันทึกสำเร็จ
            clearCart();

            // 4. เปลี่ยนหน้าไปที่ /test-payment
            if (paymentMethod === 'promptpay') {
                navigate('/test-payment', { 
                    state: { 
                        amount: amountToPay, // ส่งค่าคงที่ไป
                        orderId: currentOrderId,
                        firebaseDocId: docRef.id // ส่ง ID ไปอัปเดตสถานะตอนจ่ายเสร็จ
                    } 
                });
            } else {
                navigate('/orders');
            }

        } catch (err) {
            console.error('Firestore Error:', err.message);
            addToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
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
                            <h3 className="font-bold mb-5 text-emerald-600">📍 ข้อมูลจัดส่ง</h3>
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
                                <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                <div><label className="block text-sm font-semibold mb-1.5">เขต/อำเภอ</label><input name="district" value={form.district} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" /></div>
                                <div><label className="block text-sm font-semibold mb-1.5">จังหวัด</label><input name="province" value={form.province} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" /></div>
                                <div><label className="block text-sm font-semibold mb-1.5">รหัสไปรษณีย์</label><input name="zipcode" value={form.zipcode} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" /></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5">💰 วิธีชำระเงิน</h3>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-gray-800'}`}>
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

                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 h-fit lg:sticky lg:top-24">
                        <h3 className="font-bold text-lg mb-4">📋 สรุปคำสั่งซื้อ</h3>
                        <div className="space-y-3 text-sm mb-6 border-b pb-6 dark:border-gray-800">
                            <div className="flex justify-between"><span>ราคาสินค้า</span><span>{formatTHB(subtotal)}</span></div>
                            <div className="flex justify-between"><span>ค่าจัดส่ง</span><span>{formatTHB(shipping)}</span></div>
                            <div className="flex justify-between font-bold text-base text-emerald-700 pt-2">
                                <span>ยอดรวมทั้งหมด</span>
                                <span>{formatTHB(total)}</span>
                            </div>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50">
                            {submitting ? 'กำลังส่งข้อมูล...' : `✅ ยืนยันคำสั่งซื้อ — ${formatTHB(total)}`}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
