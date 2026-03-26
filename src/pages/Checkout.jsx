import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
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
    const [allAddresses, setAllAddresses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    
    const [form, setForm] = useState({
        name: user?.displayName || '', phone: '', email: user?.email || '',
        address: '', district: '', amphoe: '', province: '', zipcode: '',
    });

    // ✅ แก้ไขส่วนนี้: แตกข้อมูลจาก Nested Array ให้ถูกต้อง
    useEffect(() => {
        fetch('https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/jquery.Thailand.js/database/db.json')
            .then(res => res.json())
            .then(result => {
                if (result && result.data) {
                    const mappedData = [];
                    // ข้อมูลต้นทางเป็น [province, [amphoe, [[district, [zipcode, ...]]]]]
                    // เราต้องวน Loop กางมันออกมาให้เป็นแถวเดียวครับ
                    result.data.forEach(p => {
                        const province = p[0];
                        p[1].forEach(a => {
                            const amphoe = a[0];
                            a[1].forEach(d => {
                                const district = d[0];
                                d[1].forEach(z => {
                                    mappedData.push({
                                        district: district,
                                        amphoe: amphoe,
                                        province: province,
                                        zipcode: z
                                    });
                                });
                            });
                        });
                    });
                    setAllAddresses(mappedData);
                }
            })
            .catch(err => console.error("Fetch error:", err));
    }, []);

    const filteredResults = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (query.length < 2 || !Array.isArray(allAddresses)) return [];

        return allAddresses.filter(item => 
            String(item.district).includes(query) || 
            String(item.amphoe).includes(query) || 
            String(item.province).includes(query) || 
            String(item.zipcode).includes(query)
        ).slice(0, 10);
    }, [searchTerm, allAddresses]);

    const handleSelectAddress = (addr) => {
        setForm({ ...form, ...addr });
        setSearchTerm(`${addr.district} » ${addr.amphoe} » ${addr.province} (${addr.zipcode})`);
        setShowOptions(false);
    };

    if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
    if (!user) return <Navigate to="/login" replace />;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting || !form.district) return;
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
        <section className="max-w-7xl mx-auto px-4 py-10 font-sans text-left">
            <h1 className="text-2xl font-bold mb-2 text-emerald-900">💳 ชำระเงิน</h1>
            <p className="text-gray-500 mb-8 font-medium">ระบุที่อยู่จัดส่งสินค้าจากฟาร์ม</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold mb-5 text-emerald-700">📍 ข้อมูลจัดส่ง</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-emerald-400" placeholder="ชื่อ-นามสกุล *" />
                                <input name="phone" value={form.phone} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-emerald-400" placeholder="เบอร์โทรศัพท์ *" />
                            </div>
                            <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-emerald-400 mt-4" placeholder="บ้านเลขที่, หมู่, ซอย, ถนน *" />

                            <div className="mt-6 relative">
                                <label className="block text-sm font-bold mb-1.5 text-emerald-600 uppercase tracking-wider font-sans">🔎 ค้นหา ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์</label>
                                <input 
                                    value={searchTerm} 
                                    onChange={(e) => { setSearchTerm(e.target.value); setShowOptions(true); }}
                                    onFocus={() => setShowOptions(true)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/30 outline-none focus:border-emerald-400 font-medium"
                                    placeholder={allAddresses.length === 0 ? "⏳ กำลังโหลดฐานข้อมูล..." : "พิมพ์เพื่อค้นหา..."}
                                    autoComplete="off"
                                />
                                {showOptions && filteredResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                                        {filteredResults.map((addr, idx) => (
                                            <div key={idx} onClick={() => handleSelectAddress(addr)} className="px-5 py-3 hover:bg-emerald-50 cursor-pointer text-sm border-b border-gray-50 transition-colors last:border-none">
                                                <span className="font-bold text-emerald-800">{addr.district}</span> » {addr.amphoe} » {addr.province} » <span className="text-gray-400">{addr.zipcode}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-[11px]">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><p className="font-bold text-gray-400 mb-1">ตำบล</p><p className="font-semibold text-gray-700 truncate">{form.district || '-'}</p></div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><p className="font-bold text-gray-400 mb-1">อำเภอ</p><p className="font-semibold text-gray-700 truncate">{form.amphoe || '-'}</p></div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><p className="font-bold text-gray-400 mb-1">จังหวัด</p><p className="font-semibold text-gray-700 truncate">{form.province || '-'}</p></div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><p className="font-bold text-gray-400 mb-1">รหัสไปรษณีย์</p><p className="font-semibold text-gray-700 truncate">{form.zipcode || '-'}</p></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold mb-5 text-emerald-700">💰 วิธีชำระเงิน</h3>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100'}`}>
                                        <input type="radio" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-emerald-600 w-4 h-4" />
                                        <div><div className="font-semibold text-sm">{m.label}</div><div className="text-xs text-gray-500">{m.desc}</div></div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-md h-fit lg:sticky lg:top-24 border border-gray-100">
                        <h3 className="font-bold text-lg mb-4 text-emerald-900 font-sans">📋 สรุปรายการ</h3>
                        <div className="flex justify-between text-lg font-black pt-1 text-emerald-900 mb-6 border-t border-gray-100 pt-4"><span>ยอดสุทธิ</span><span>{formatTHB(total)}</span></div>
                        <button type="submit" disabled={submitting || allAddresses.length === 0} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-200 transition-all disabled:bg-gray-300">
                            {submitting ? 'กำลังส่งข้อมูล...' : `✅ ยืนยันการสั่งซื้อ`}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
