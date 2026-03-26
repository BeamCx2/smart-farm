import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatTHB, generateOrderId, toSatang } from '../lib/utils';

// ✅ Import เฉพาะตัว Component (ไม่ต้องมี setup เพราะเวอร์ชั่นนี้โหลดออโต้ครับ)
import { ThailandAddressTypeahead } from 'react-thailand-address-autocomplete';

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
        amphoe: '',     
        province: '',   
        zipcode: '',    
    });

    if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // ✅ ฟังก์ชันจัดการเมื่อเลือกที่อยู่จาก Dropdown
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

        // เช็คว่ากรอกที่อยู่ครบหรือยัง (ป้องกันลืมเลือกจาก Dropdown)
        if (!form.province || !form.zipcode) {
            addToast('กรุณาเลือกที่หลังจากช่องค้นหาให้ครบถ้วนครับ', 'error');
            return;
        }

        setSubmitting(true);

        const currentOrderId = generateOrderId();
        const batch = writeBatch(db);
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
        } catch (err) {
            addToast('ล้มเหลว: ' + err.message, 'error');
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold mb-2 text-emerald-900 font-sans">💳 ชำระเงิน</h1>
            <p className="text-gray-500 mb-8 font-medium">ระบุที่อยู่จัดส่งสินค้าจากฟาร์ม</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* ส่วนข้อมูลจัดส่ง */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5 flex items-center gap-2 text-emerald-700">📍 ข้อมูลจัดส่ง</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 font-sans text-gray-700">ชื่อ-นามสกุล *</label>
                                    <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="สมชาย ใจดี" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 font-sans text-gray-700">เบอร์โทรศัพท์ *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} required type="tel" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="081-234-5678" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-semibold mb-1.5 font-sans text-gray-700">บ้านเลขที่, หมู่, ซอย, ถนน *</label>
                                <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="123/4 ม.5 ซ.รื่นรมย์" />
                            </div>

                            {/* 🚀 ค้นหาที่อยู่แบบ Auto-complete */}
                            <div className="mt-4">
                                <label className="block text-sm font-bold mb-1.5 text-emerald-600 uppercase tracking-wider font-sans">ค้นหา ตำบล / อำเภอ / รหัสไปรษณีย์ *</label>
                                <ThailandAddressTypeahead 
                                    onSelect={onAddressSelect}
                                    inputClassName="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 focus:border-emerald-400 bg-emerald-50/30 outline-none transition-all text-sm font-medium"
                                    placeholder="พิมพ์ค้นหา... (เช่น จตุจักร หรือ 10900)"
                                />
                            </div>

                            {/* ช่องแสดงผลที่ถูกเลือก (Auto-fill) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 font-sans">แขวง/ตำบล</label>
                                    <input value={form.district} readOnly className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 font-sans">เขต/อำเภอ</label>
                                    <input value={form.amphoe} readOnly className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 font-sans">จังหวัด</label>
                                    <input value={form.province} readOnly className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 font-semibold" />
                                </div>
                            </div>
                        </div>

                        {/* เลือกวิธีชำระเงิน */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold mb-5 flex items-center gap-2 text-emerald-700 font-sans">💰 วิธีชำระเงิน</h3>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                                        <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-emerald-600 w-4 h-4" />
                                        <div>
                                            <div className="font-semibold text-sm font-sans">{m.label}</div>
                                            <div className="text-xs text-gray-500 font-sans">{m.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* สรุปรายการสินค้าด้านขวา */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-md border border-gray-100 h-fit lg:sticky lg:top-24">
                        <h3 className="font-bold text-lg mb-4 text-emerald-900 font-sans">📋 สรุปรายการ</h3>
                        <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-3 items-center">
                                    <img src={item.image || 'https://placehold.co/50'} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold truncate font-sans">{item.name}</div>
                                        <div className="text-xs text-gray-400 font-sans">จำนวน {item.qty} ชิ้น</div>
                                    </div>
                                    <div className="text-sm font-black text-emerald-700 font-sans">{formatTHB(item.price * item.qty)}</div>
                                </div>
                            ))}
                        </div>
                        <hr className="border-gray-100 my-4" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-500 font-sans"><span>รวมค่าสินค้า</span><span>{formatTHB(subtotal)}</span></div>
                            <div className="flex justify-between text-gray-500 font-sans"><span>ค่าจัดส่ง</span><span>{shipping === 0 ? <span className="text-emerald-600">ฟรี</span> : formatTHB(shipping)}</span></div>
                            <hr className="border-gray-100" />
                            <div className="flex justify-between text-lg font-black pt-1 text-emerald-900 font-sans"><span>ยอดสุทธิ</span><span>{formatTHB(total)}</span></div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full mt-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'กำลังส่งข้อมูล...' : `✅ ยืนยันการสั่งซื้อ`}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
