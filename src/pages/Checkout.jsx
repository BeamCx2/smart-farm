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
    
    // กำหนดค่าเริ่มต้นเป็น promptpay
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

    // 🚨 ป้องกันหน้าขาว: ถ้าตะกร้าว่างและไม่ได้กำลังส่งข้อมูล ให้ดีดกลับหน้าตะกร้า
    if (items.length === 0 && !submitting) {
        return <Navigate to="/cart" replace />;
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const currentOrderId = generateOrderId();
        const amountToPay = total; // เก็บค่ายอดรวมไว้ก่อน

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
            // 1. บันทึกลง Firebase
            const docRef = await addDoc(collection(db, 'orders'), orderData);
            addToast('บันทึกคำสั่งซื้อเรียบร้อย', 'success');

            // 2. เคลียร์ตะกร้าก่อนเปลี่ยนหน้า (เพื่อให้หน้าใหม่โหลดข้อมูลสะอาด)
            clearCart();

            // 3. ไปหน้าชำระเงิน
            if (paymentMethod === 'promptpay') {
                navigate('/test-payment', { 
                    state: { 
                        amount: amountToPay, 
                        orderId: currentOrderId,
                        firebaseDocId: docRef.id 
                    } 
                });
            } else {
                navigate('/orders');
            }

        } catch (err) {
            console.error('Firestore Error:', err.message);
            addToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 min-h-screen">
            <h1 className="text-2xl font-bold mb-2 text-emerald-700">💳 ชำระเงิน</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">กรอกข้อมูลเพื่อดำเนินการสั่งซื้อ</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left — ข้อมูลลูกค้า */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-6 text-lg">📍 ข้อมูลจัดส่ง</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 text-gray-600">ชื่อ-นามสกุล *</label>
                                    <input name="name" value={form.name} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 dark:bg-gray-800 focus:border-emerald-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 text-gray-600">เบอร์โทรศัพท์ *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 dark:bg-gray-800 focus:border-emerald-500 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="mt-5">
                                <label className="block text-sm font-semibold mb-1.5 text-gray-600">ที่อยู่จัดส่ง *</label>
                                <textarea name="address" value={form.address} onChange={handleChange} required rows="3" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 dark:bg-gray-800 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                        </div>

                        {/* วิธีการชำระเงิน */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-6 text-lg">💰 วิธีชำระเงิน</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-gray-800 hover:border-emerald-300'}`}>
                                        <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-emerald-600 w-5 h-5" />
                                        <div>
                                            <div className="font-bold text-gray-800 dark:text-gray-100">{m.label}</div>
                                            <div className="text-xs text-gray-500">{m.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right — สรุปยอดเงิน */}
                    <div className="space-y-6 h-fit lg:sticky lg:top-24">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-50 dark:border-gray-800">
                            <h3 className="font-bold text-xl mb-6">📋 สรุปคำสั่งซื้อ</h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-500"><span>ราคาสินค้า</span><span>{formatTHB(subtotal)}</span></div>
                                <div className="flex justify-between text-gray-500"><span>ค่าจัดส่ง</span><span>{shipping === 0 ? <span className="text-emerald-600 font-bold">ฟรี</span> : formatTHB(shipping)}</span></div>
                                <div className="border-t pt-4 flex justify-between items-end">
                                    <span className="font-bold">ยอดสุทธิ</span>
                                    <span className="text-3xl font-black text-emerald-600">{formatTHB(total)}</span>
                                </div>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={submitting} 
                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'กำลังส่งข้อมูล...' : `✅ สั่งซื้อสินค้า — ${formatTHB(total)}`}
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">Secure Checkout by Smart Farm</p>
                        </div>
                    </div>
                </div>
            </form>
        </section>
    );
}
