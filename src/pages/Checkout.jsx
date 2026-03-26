import { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatTHB, generateOrderId, toSatang } from '../lib/utils';
import THAI_ADDRESS_DATABASE from '../data/thailand_address.json';

export default function Checkout() {
    const { items, subtotal, shipping, total, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('promptpay');
    
    // State สำหรับระบบ Search
    const [searchTerm, setSearchTerm] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    
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

    // ✅ 2. Logic การค้นหาที่อยู่ (ประสิทธิภาพสูงด้วย useMemo)
    const filteredResults = useMemo(() => {
        const query = searchTerm.trim();
        if (query.length < 2) return [];

        return THAI_ADDRESS_DATABASE.filter(item => 
            item.district.includes(query) || 
            item.amphoe.includes(query) || 
            item.province.includes(query) || 
            item.zipcode.toString().includes(query)
        ).slice(0, 10); // แสดงแค่ 10 รายการแรกเพื่อความรวดเร็ว
    }, [searchTerm]);

    const handleSelectAddress = (addr) => {
        setForm({
            ...form,
            district: addr.district,
            amphoe: addr.amphoe,
            province: addr.province,
            zipcode: addr.zipcode
        });
        setSearchTerm(`${addr.district} » ${addr.amphoe} » ${addr.province} (${addr.zipcode})`);
        setShowOptions(false);
    };

    if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        // เช็คว่าเลือกที่อยู่หรือยัง
        if (!form.district || !form.province) {
            addToast('กรุณาเลือกที่อยู่จากรายการค้นหาให้ถูกต้องครับ', 'error');
            return;
        }

        setSubmitting(true);
        const currentOrderId = generateOrderId();
        const batch = writeBatch(db);
        const newOrderRef = doc(collection(db, 'orders'));

        try {
            batch.set(newOrderRef, {
                orderId: currentOrderId,
                userId: user.uid,
                customer: { ...form },
                items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image || '' })),
                subtotal, shipping, total,
                totalSatang: toSatang(total),
                paymentMethod, status: 'pending',
                createdAt: serverTimestamp(),
            });

            items.forEach(item => {
                const productRef = doc(db, 'products', item.id);
                batch.update(productRef, { stock: increment(-item.qty) });
            });

            await batch.commit();
            addToast('สั่งซื้อเรียบร้อย', 'success');
            clearCart();
            navigate('/payment', { state: { amount: total, orderId: currentOrderId, firebaseId: newOrderRef.id } });
        } catch (err) {
            addToast('ล้มเหลว: ' + err.message, 'error');
            setSubmitting(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 py-10 font-sans">
            <h1 className="text-2xl font-bold mb-2 text-emerald-900">💳 ชำระเงิน</h1>
            <p className="text-gray-500 mb-8 font-medium">ระบุที่อยู่จัดส่งสินค้าจากฟาร์ม</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold mb-5 flex items-center gap-2 text-emerald-700">📍 ข้อมูลจัดส่ง</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-emerald-400" placeholder="ชื่อ-นามสกุล *" />
                                <input name="phone" value={form.phone} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-emerald-400" placeholder="เบอร์โทรศัพท์ *" />
                            </div>
                            
                            <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-emerald-400 mt-4" placeholder="บ้านเลขที่, หมู่, ซอย, ถนน *" />

                            {/* 🚀 ระบบ Search ที่อยู่ตัวเทพ */}
                            <div className="mt-6 relative">
                                <label className="block text-sm font-bold mb-1.5 text-emerald-600 uppercase tracking-wider">🔎 ค้นหา ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์</label>
                                <input 
                                    value={searchTerm} 
                                    onChange={(e) => { setSearchTerm(e.target.value); setShowOptions(true); }}
                                    onFocus={() => setShowOptions(true)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/30 outline-none focus:border-emerald-400 font-medium"
                                    placeholder="พิมพ์อย่างน้อย 2 ตัวละคร... (เช่น ลาดยาว หรือ 10900)"
                                />
                                
                                {showOptions && filteredResults.length > 0 && (
                                    <div className="absolute z-20 w-full mt-2 bg-white border border-emerald-50 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                                        {filteredResults.map((addr, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => handleSelectAddress(addr)}
                                                className="px-5 py-3 hover:bg-emerald-50 cursor-pointer text-sm border-b border-gray-50 transition-colors"
                                            >
                                                <span className="font-bold text-emerald-800">{addr.district}</span> » {addr.amphoe} » {addr.province} » <span className="text-gray-400">{addr.zipcode}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* แสดงค่าที่ถูกเลือกแบบ Read-only */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">ตำบล</p>
                                    <p className="text-sm font-semibold text-gray-700">{form.district || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">อำเภอ</p>
                                    <p className="text-sm font-semibold text-gray-700">{form.amphoe || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">จังหวัด</p>
                                    <p className="text-sm font-semibold text-gray-700">{form.province || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">รหัสไปรษณีย์</p>
                                    <p className="text-sm font-semibold text-gray-700">{form.zipcode || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold mb-5 text-emerald-700">💰 วิธีชำระเงิน</h3>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                                        <input type="radio" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-emerald-600 w-4 h-4" />
                                        <div>
                                            <div className="font-semibold text-sm">{m.label}</div>
                                            <div className="text-xs text-gray-500">{m.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-md h-fit lg:sticky lg:top-24 border border-gray-100">
                        <h3 className="font-bold text-lg mb-4 text-emerald-900">📋 สรุปรายการ</h3>
                        <div className="flex justify-between text-lg font-black pt-1 text-emerald-900 mb-6"><span>ยอดสุทธิ</span><span>{formatTHB(total)}</span></div>
                        <button type="submit" disabled={submitting} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-200 transition-all">
                            {submitting ? 'กำลังส่งข้อมูล...' : `✅ ยืนยันการสั่งซื้อ`}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
