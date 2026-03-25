import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatTHB, generateOrderId, toSatang } from '../lib/utils';

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

    // 🚨 จุดแก้มหากาพย์: ห้ามดีดกลับถ้ากำลัง Submitting อยู่ (ป้องกันหน้าขาว/เด้งกลับ)
    if (items.length === 0 && !submitting) {
        return <Navigate to="/cart" replace />;
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const currentOrderId = generateOrderId();
        const amountToPay = total; // เก็บค่ายอดเงินไว้ก่อนตะกร้าจะว่าง

        const orderData = {
            orderId: currentOrderId,
            userId: user.uid,
            customer: { ...form },
            items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image || '' })),
            subtotal, 
            shipping, 
            total: amountToPay,
            totalSatang: toSatang(amountToPay),
            paymentMethod, 
            status: 'pending',
            createdAt: serverTimestamp(),
        };

        try {
            console.log("🚀 บันทึกออเดอร์ลง Firebase...");
            const docRef = await addDoc(collection(db, 'orders'), orderData);
            
            // ✅ บันทึกสำเร็จแล้ว ค่อยจัดการเรื่องเปลี่ยนหน้า
            addToast('บันทึกคำสั่งซื้อเรียบร้อย', 'success');

            if (paymentMethod === 'promptpay') {
                // ➡️ ไปหน้าจ่ายเงิน พร้อมส่งข้อมูลที่จำเป็น
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

            // 🚨 ล้างตะกร้าเป็นลำดับสุดท้ายจริงๆ เพื่อให้ Navigate ทำงานจบก่อน
            setTimeout(() => clearCart(), 100);

        } catch (err) {
            console.error('Firestore Error:', err.message);
            addToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
            setSubmitting(false); // ถ้า Error ให้ปลดล็อคเพื่อให้แก้ข้อมูลได้
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 py-10 min-h-screen">
            <h1 className="text-2xl font-bold mb-8 text-emerald-700 flex items-center gap-2">
                <span>💳 ชำระเงิน</span>
            </h1>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold mb-6 text-lg">📍 ข้อมูลจัดส่ง</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-600">ชื่อ-นามสกุล</label>
                                <input name="name" value={form.name} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 dark:bg-gray-800 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-600">เบอร์โทรศัพท์</label>
                                <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 dark:bg-gray-800 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                        </div>
                        <div className="mt-5 space-y-2">
                            <label className="text-sm font-semibold text-gray-600">ที่อยู่จัดส่งโดยละเอียด</label>
                            <textarea name="address" value={form.address} onChange={handleChange} required rows="3" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 dark:bg-gray-800 focus:border-emerald-500 outline-none transition-all" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-50 dark:border-gray-800 h-fit lg:sticky lg:top-24">
                        <h3 className="font-bold text-xl mb-6">สรุปยอดชำระ</h3>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-gray-500"><span>ราคาสินค้า</span><span>{formatTHB(subtotal)}</span></div>
                            <div className="flex justify-between text-gray-500"><span>ค่าจัดส่ง</span><span>{shipping === 0 ? 'ฟรี' : formatTHB(shipping)}</span></div>
                            <div className="border-t pt-4 flex justify-between items-end">
                                <span className="font-bold">ยอดสุทธิ</span>
                                <span className="text-3xl font-black text-emerald-600">{formatTHB(total)}</span>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                            {submitting ? 'กำลังบันทึกข้อมูล...' : '✅ ยืนยันการสั่งซื้อ'}
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-4">ระบบจะพาคุณไปที่หน้าชำระเงิน PromptPay</p>
                    </div>
                </div>
            </form>
        </section>
    );
}
