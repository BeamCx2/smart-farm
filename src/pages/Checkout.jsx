import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'; // ลบ increment ออกเพราะเราไปตัดสต๊อกหน้า Payment แทน
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
        address: '',     
        subDistrict: '', // ✅ แก้จาก district เป็น subDistrict (ตำบล)
        district: '',    // ✅ แก้จาก amphoe เป็น district (อำเภอ)
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

            // ⚠️ [Stock Update Policy]: 
            // ลบการตัดสต๊อกตรงนี้ออก (เพราะเราจะไปตัดจริงที่หน้า Payment เมื่อชำระเงินสำเร็จเท่านั้น)
            
            await batch.commit();
            addToast('สร้างคำสั่งซื้อเรียบร้อย', 'success');
            clearCart();
            
            // ส่งไปหน้า Payment พร้อมค่าที่จำเป็น
            navigate('/payment', { state: { amount: total, orderId: currentOrderId } });
        } catch (err) {
            addToast('ล้มเหลว: ' + err.message, 'error');
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 py-10 font-sans text-left font-black">
            <h1 className="text-2xl font-black mb-2 text-emerald-900 uppercase">💳 ชำระเงิน</h1>
            <p className="text-gray-500 mb-8 font-black text-xs uppercase tracking-widest">Shipping & Payment Details</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* 🏠 ข้อมูลจัดส่ง */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 font-black">
                            <h3 className="font-black mb-6 flex items-center gap-2 text-emerald-700 text-lg uppercase leading-none">📍 ข้อมูลจัดส่ง</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-black">
                                <div>
                                    <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest leading-none">ชื่อ-นามสกุล *</label>
                                    <input name="name" value={form.name} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black" placeholder="ชื่อผู้รับ" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest leading-none">เบอร์โทรศัพท์ *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black" placeholder="08x-xxx-xxxx" />
                                </div>
                            </div>

                            <div className="mt-5 font-black">
                                <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest leading-none">ที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน) *</label>
                                <textarea name="address" value={form.address} onChange={handleChange} required rows="2" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black" placeholder="ระบุบ้านเลขที่และถนน..." />
                            </div>

                            <div className="grid grid-cols-2 gap-5 mt-5 font-black">
                                <div>
                                    <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest leading-none">ตำบล / แขวง *</label>
                                    <input name="subDistrict" value={form.subDistrict} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black" placeholder="ตำบล" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest leading-none">อำเภอ / เขต *</label>
                                    <input name="district" value={form.district} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black" placeholder="อำเภอ" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5 mt-5 font-black">
                                <div>
                                    <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest leading-none">จังหวัด *</label>
                                    <input name="province" value={form.province} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black" placeholder="จังหวัด" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest leading-none">รหัสไปรษณีย์ *</label>
                                    <input name="zipcode" value={form.zipcode} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 outline-none focus:border-emerald-400 bg-gray-50/50 font-black" placeholder="12345" />
                                </div>
                            </div>
                        </div>

                        {/* 💰 วิธีชำระเงิน */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 font-black">
                            <h3 className="font-black mb-6 text-emerald-700 text-lg uppercase leading-none">💰 วิธีชำระเงิน</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-black">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-50 hover:border-emerald-200'}`}>
                                        <input type="radio" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-emerald-600 w-5 h-5" />
                                        <div>
                                            <div className="font-black text-sm text-gray-800 uppercase leading-none">{m.label}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 uppercase leading-none">{m.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* สรุปรายการ */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-emerald-100/50 h-fit lg:sticky lg:top-24 border border-emerald-50 text-center font-black">
                        <h3 className="font-black text-xl mb-8 text-emerald-900 border-b border-gray-50 pb-4 uppercase leading-none">📋 สรุปรายการ</h3>
                        
                        <div className="flex justify-between items-center text-lg font-black text-emerald-900 mb-10 font-black">
                            <span className="uppercase text-[10px] text-gray-400 tracking-widest">Total</span>
                            <span className="text-4xl tracking-tighter leading-none">{formatTHB(total)}</span>
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="w-full py-6 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:bg-gray-300"
                        >
                            {submitting ? 'Creating Order...' : `✅ ยืนยันการสั่งซื้อ`}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
