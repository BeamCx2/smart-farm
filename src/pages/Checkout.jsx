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
    if (items.length === 0) return <Navigate to="/cart" replace />;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const currentOrderId = generateOrderId();
        const amountToPay = total; // 🚨 เก็บค่ายอดเงินไว้ก่อนป้องกันตะกร้าว่าง

        const orderData = {
            orderId: currentOrderId,
            userId: user.uid,
            customer: { ...form },
            items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image || '' })),
            subtotal, shipping, total: amountToPay,
            totalSatang: toSatang(amountToPay),
            paymentMethod, status: 'pending',
            createdAt: serverTimestamp(),
        };

        try {
            const docRef = await addDoc(collection(db, 'orders'), orderData);
            addToast('บันทึกคำสั่งซื้อเรียบร้อย', 'success');

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

            // 🚨 ย้ายมาเคลียร์ตะกร้าบรรทัดสุดท้าย
            clearCart(); 

        } catch (err) {
            console.error('Firestore Error:', err.message);
            addToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-bold mb-8 text-emerald-700">💳 ชำระเงิน</h1>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold mb-5">📍 ข้อมูลจัดส่ง</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input name="name" value={form.name} onChange={handleChange} placeholder="ชื่อ-นามสกุล" required className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-emerald-500" />
                            <input name="phone" value={form.phone} onChange={handleChange} placeholder="เบอร์โทรศัพท์" required className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-emerald-500" />
                        </div>
                        <input name="address" value={form.address} onChange={handleChange} placeholder="ที่อยู่" required className="w-full mt-4 px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-emerald-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 h-fit lg:sticky lg:top-24">
                    <h3 className="font-bold text-lg mb-4">สรุปยอดชำระ</h3>
                    <div className="text-2xl font-bold text-emerald-600 mb-6">{formatTHB(total)}</div>
                    <button type="submit" disabled={submitting} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50">
                        {submitting ? 'กำลังส่งข้อมูล...' : '✅ ยืนยันการสั่งซื้อ'}
                    </button>
                </div>
            </form>
        </section>
    );
}
