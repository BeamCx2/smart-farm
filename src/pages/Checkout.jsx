import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
<<<<<<< HEAD
import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
=======
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'; 
>>>>>>> 333117e554d91461d5abe32f8b17a295b591eb82
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatTHB, generateOrderId, toSatang } from '../lib/utils';
import { ThailandAddressTypeahead } from 'react-thailand-address-autocomplete';

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
<<<<<<< HEAD
=======
    const [paymentMethod, setPaymentMethod] = useState('promptpay');
>>>>>>> 333117e554d91461d5abe32f8b17a295b591eb82
    
    const [form, setForm] = useState({
        name: user?.displayName || '', 
        phone: '', 
        email: user?.email || '',
<<<<<<< HEAD
        address: '',    
        district: '',   
        amphoe: '',     
        province: '',   
        zipcode: '',    
=======
        address: '',      
        subDistrict: '', 
        district: '',    
        province: '',    
        zipcode: '',     
>>>>>>> 333117e554d91461d5abe32f8b17a295b591eb82
    });

    if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // ✅ ฟังก์ชันเมื่อเลือกที่อยู่
    const onAddressSelect = (address) => {
        setForm({
            ...form,
            district: address.subdistrict, 
            amphoe: address.district,      
            province: address.province,    
            zipcode: address.zipcode       
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        const currentOrderId = generateOrderId();
        const batch = writeBatch(db);
        const newOrderRef = doc(collection(db, 'orders'));

<<<<<<< HEAD
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
=======
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

>>>>>>> 333117e554d91461d5abe32f8b17a295b591eb82
        } catch (err) {
            addToast('ล้มเหลว: ' + err.message, 'error');
            setSubmitting(false);
        }
    };

    return (
<<<<<<< HEAD
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
                                    <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="สมชาย ใจดี" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">เบอร์โทรศัพท์ *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="081-234-5678" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-semibold mb-1.5">บ้านเลขที่, หมู่, ซอย, ถนน *</label>
                                <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="123/4 ม.5 ซ.รื่นรมย์" />
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-bold mb-1.5 text-emerald-600 uppercase tracking-wider">ค้นหา ตำบล / อำเภอ / รหัสไปรษณีย์ *</label>
                                {/* ✅ ตรวจสอบชื่อ Component และ Props ให้ตรงกับ Library */}
                                <ThailandAddressTypeahead 
                                    onSelect={onAddressSelect}
                                    inputClassName="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 focus:border-emerald-400 bg-emerald-50/30 outline-none transition-all text-sm font-medium"
                                    placeholder="พิมพ์ค้นหา... (เช่น จตุจักร หรือ 10900)"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">แขวง/ตำบล</label>
                                    <input value={form.district} readOnly className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">เขต/อำเภอ</label>
                                    <input value={form.amphoe} readOnly className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">จังหวัด</label>
                                    <input value={form.province} readOnly className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 font-semibold" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5 flex items-center gap-2 text-emerald-700">💰 วิธีชำระเงิน</h3>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                                        <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-emerald-600 w-4 h-4" />
                                        <div>
                                            <div className="font-semibold text-sm">{m.label}</div>
                                            <div className="text-xs text-gray-500">{m.desc}</div>
=======
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
>>>>>>> 333117e554d91461d5abe32f8b17a295b591eb82
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

<<<<<<< HEAD
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-md border border-gray-100 h-fit lg:sticky lg:top-24">
                        <h3 className="font-bold text-lg mb-4 text-emerald-900">📋 สรุปรายการ</h3>
                        <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
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
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full mt-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'กำลังส่งข้อมูล...' : `✅ ยืนยันการสั่งซื้อ`}
=======
                    {/* สรุปรายการ */}
                    <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-emerald-100/50 h-fit lg:sticky lg:top-24 border border-emerald-50">
                        <h3 className="font-black text-xl mb-10 text-emerald-900 border-b border-gray-50 pb-6 uppercase tracking-tighter text-center">ORDER SUMMARY</h3>
                        
                        <div className="space-y-4 mb-10">
                            <div className="flex justify-between text-[10px] text-gray-400 font-black tracking-widest uppercase">
                                <span>Subtotal</span>
                                <span>{formatTHB(subtotal)}</span>
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
>>>>>>> 333117e554d91461d5abe32f8b17a295b591eb82
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}