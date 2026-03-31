import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'; 
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatTHB, generateOrderId, toSatang } from '../lib/utils';

const PAYMENT_METHODS = [
    { id: 'promptpay', label: '📱 PROMPTPAY QR', desc: 'สแกนจ่ายผ่าน QR CODE' },
    { id: 'bank', label: '🏦 โอนเงินผ่านธนาคาร', desc: 'โอนตรงเข้าบัญชีกสิกรไทย' },
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
        address: '',      
        subDistrict: '', 
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

        try {
            // 📝 บันทึกข้อมูลออเดอร์ลง Firebase
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
            
            await batch.commit();
            addToast('สร้างคำสั่งซื้อเรียบร้อย', 'success');
            clearCart();
            
            // 🚀 [จุดแก้ไขสำคัญ]: แยกเส้นทางตามวิธีชำระเงิน
            if (paymentMethod === 'promptpay') {
                // ไปหน้าสแกน QR
                navigate('/payment', { state: { amount: total, orderId: currentOrderId } });
            } else {
                // ไปหน้าโอนผ่านบัญชีธนาคาร (BankTransfer.jsx)
                navigate('/bank-transfer', { state: { amount: total, orderId: currentOrderId } });
            }

        } catch (err) {
            addToast('ล้มเหลว: ' + err.message, 'error');
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 py-10 font-sans text-left font-black">
            <h1 className="text-2xl font-black mb-2 text-emerald-900 uppercase tracking-tighter">💳 CHECKOUT</h1>
            <p className="text-gray-400 mb-8 font-black text-[10px] uppercase tracking-[0.3em]">Smart Farm Gateway System</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* 📍 ข้อมูลจัดส่ง */}
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
                            <h3 className="font-black mb-8 text-emerald-700 text-lg uppercase leading-none border-l-4 border-emerald-500 pl-4">📍 SHIPPING ADDRESS</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[9px] font-black mb-3 text-gray-400 uppercase tracking-widest leading-none">Full Name *</label>
                                    <input name="name" value={form.name} onChange={handleChange} required className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black text-xs uppercase" placeholder="NAME - SURNAME" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black mb-3 text-gray-400 uppercase tracking-widest leading-none">Phone Number *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black text-xs" placeholder="0XX-XXX-XXXX" />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-[9px] font-black mb-3 text-gray-400 uppercase tracking-widest leading-none">Address Details *</label>
                                <textarea name="address" value={form.address} onChange={handleChange} required rows="2" className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black text-xs uppercase" placeholder="HOUSE NO. / STREET / ALLEY" />
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-6">
                                <div><input name="subDistrict" value={form.subDistrict} onChange={handleChange} required className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black text-xs uppercase" placeholder="SUB-DISTRICT" /></div>
                                <div><input name="district" value={form.district} onChange={handleChange} required className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black text-xs uppercase" placeholder="DISTRICT" /></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-6">
                                <div><input name="province" value={form.province} onChange={handleChange} required className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black text-xs uppercase" placeholder="PROVINCE" /></div>
                                <div><input name="zipcode" value={form.zipcode} onChange={handleChange} required className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black text-xs uppercase" placeholder="ZIP CODE" /></div>
                            </div>
                        </div>

                        {/* 💰 วิธีชำระเงิน */}
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
                            <h3 className="font-black mb-8 text-emerald-700 text-lg uppercase leading-none border-l-4 border-emerald-500 pl-4">💰 PAYMENT METHOD</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-5 p-7 rounded-[2rem] border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-50 hover:border-emerald-100'}`}>
                                        <input type="radio" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-emerald-600 w-5 h-5" />
                                        <div className="leading-none">
                                            <div className="font-black text-xs text-gray-800 uppercase tracking-tight">{m.label}</div>
                                            <div className="text-[9px] text-gray-400 mt-2 uppercase tracking-widest">{m.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* สรุปรายการ */}
                    <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-emerald-100/50 h-fit lg:sticky lg:top-24 border border-emerald-50">
                        <h3 className="font-black text-xl mb-10 text-emerald-900 border-b border-gray-50 pb-6 uppercase tracking-tighter text-center">ORDER SUMMARY</h3>
                        
                        <div className="space-y-4 mb-10">
                            <div className="flex justify-between text-[10px] text-gray-400 font-black tracking-widest uppercase">
                                <span>Subtotal</span>
                                <span>{formatTHB(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 font-black tracking-widest uppercase">
                                <span>Shipping</span>
                                <span>{formatTHB(shipping)}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-900 pt-6 border-t border-gray-50">
                                <span className="font-black text-sm uppercase">Total</span>
                                <span className="text-4xl font-black tracking-tighter">{formatTHB(total)}</span>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="w-full py-6 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:bg-gray-200"
                        >
                            {submitting ? 'PROCESSING...' : 'PLACE ORDER'}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
