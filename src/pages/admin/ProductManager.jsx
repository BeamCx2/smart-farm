import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, CATEGORIES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

const emptyProduct = { name: '', description: '', price: '', stock: '', category: '', image: '', video: '', status: 'active' };

export default function ProductManager() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyProduct);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    // 1. โหลดข้อมูลสินค้า
    const load = async () => {
        try {
            setLoading(true);
            const snap = await getDocs(collection(db, 'products'));
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const sortedData = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setProducts(sortedData);
        } catch (err) {
            console.error("Load Error:", err);
            addToast('ไม่สามารถโหลดข้อมูลได้: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // 🚨 ฟังก์ชัน Sync สต๊อกเริ่มต้น (ใช้แก้ปัญหาถ้าใน Firebase ไม่มีฟิลด์ stock)
    const syncAllStocks = async () => {
        if(!confirm('ระบบจะเติมสต๊อกเริ่มต้น 50 ชิ้นให้สินค้าทุกชิ้นใน Firebase ใช่ไหม?')) return;
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'products'));
            const promises = snap.docs.map(d => 
                updateDoc(doc(db, 'products', d.id), { stock: 50 })
            );
            await Promise.all(promises);
            addToast('รีเซ็ตสต๊อกสินค้าทุกชิ้นเป็น 50 แล้ว!', 'success');
            load();
        } catch (e) { 
            addToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // 2. ฟังก์ชันอัปเดตสต๊อกด่วน (+ / -)
    const handleUpdateStock = async (productId, currentStock, amount) => {
        const newStock = parseInt(currentStock || 0) + amount;
        if (newStock < 0) return;

        try {
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, { stock: newStock });
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
            addToast('อัปเดตสต๊อกแล้ว', 'success');
        } catch (e) {
            addToast('ผิดพลาด: ' + e.message, 'error');
        }
    };

    // 3. จัดการ Modal เพิ่ม/แก้ไข
    const openAdd = () => { setEditId(null); setForm(emptyProduct); setModalOpen(true); };
    const openEdit = (p) => { 
        setEditId(p.id); 
        setForm({ 
            name: p.name, 
            description: p.description, 
            price: p.price, 
            stock: p.stock || 0, // ป้องกันค่า null
            category: p.category, 
            image: p.image || '', 
            video: p.video || '', 
            status: p.status || 'active' 
        }); 
        setModalOpen(true); 
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { addToast('รูปภาพต้องไม่เกิน 5MB', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setForm({ ...form, image: ev.target.result });
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const data = { 
            ...form, 
            price: Number(form.price), 
            stock: Number(form.stock) || 0 
        };
        try {
            if (editId) {
                await updateDoc(doc(db, 'products', editId), data);
                addToast('แก้ไขสินค้าสำเร็จ!', 'success');
            } else {
                await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
                addToast('เพิ่มสินค้าสำเร็จ!', 'success');
            }
            setModalOpen(false);
            load();
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('คุณต้องการลบสินค้านี้?')) return;
        try {
            await deleteDoc(doc(db, 'products', id));
            addToast('ลบสินค้าสำเร็จ', 'info');
            load();
        } catch (err) {
            addToast('ไม่สามารถลบได้: ' + err.message, 'error');
        }
    };

    if (loading) {
        return <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
    }

    return (
        <div className="p-4 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl font-bold">📦 จัดการสินค้าและสต๊อก</h1>
                <div className="flex gap-2">
                    <button onClick={syncAllStocks} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-all">
                        🔄 รีเซ็ตสต๊อก (50)
                    </button>
                    <button onClick={openAdd} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all">
                        ➕ เพิ่มสินค้าใหม่
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-emerald-50 dark:bg-emerald-900/20">
                        <tr>
                            <th className="px-6 py-4 text-left font-bold uppercase text-emerald-800">รูป</th>
                            <th className="px-6 py-4 text-left font-bold uppercase text-emerald-800">ชื่อสินค้า</th>
                            <th className="px-6 py-4 text-center font-bold uppercase text-emerald-800">จัดการสต๊อก</th>
                            <th className="px-6 py-4 text-left font-bold uppercase text-emerald-800">ราคา</th>
                            <th className="px-6 py-4 text-right font-bold uppercase text-emerald-800">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {products.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold">ยังไม่มีสินค้าในระบบ</td></tr>
                        ) : products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <img src={p.image || 'https://placehold.co/100?text=P'} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                                </td>
                                <td className="px-6 py-4 font-bold">{p.name}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, -1)} className="w-8 h-8 bg-red-50 text-red-600 rounded-xl font-bold">-</button>
                                        <span className={`font-black text-lg min-w-[30px] text-center ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                                            {p.stock || 0}
                                        </span>
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, 1)} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl font-bold">+</button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-black">{formatTHB(p.price)}</td>
                                <td className="px-6 py-4 text-right space-x-3">
                                    <button onClick={() => openEdit(p)} className="text-xs font-bold text-emerald-600">✏️ แก้ไข</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-xs font-bold text-red-400">🗑️ ลบ</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal - เพิ่ม/แก้ไขสินค้า */}
            {modalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black mb-8">{editId ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}</h2>
                        <form onSubmit={handleSave} className="space-y-5">
                            <div><label className="text-xs font-black text-gray-400">ชื่อสินค้า *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:bg-gray-800 outline-none" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-black text-gray-400">ราคา *</label><input name="price" type="number" value={form.price} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:bg-gray-800 outline-none" /></div>
                                <div><label className="text-xs font-black text-gray-400">สต็อกเริ่มต้น *</label><input name="stock" type="number" value={form.stock} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:bg-gray-800 outline-none" /></div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400">หมวดหมู่ *</label>
                                <select name="category" value={form.category} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:bg-gray-800 outline-none">
                                    <option value="">เลือกหมวดหมู่</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 font-bold border-2 rounded-2xl">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl">
                                    {saving ? 'กำลังบันทึก...' : 'ยืนยัน'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
