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
            const snap = await getDocs(collection(db, 'products'));
            setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            addToast('ไม่สามารถโหลดข้อมูลได้', 'error');
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    // 2. 🚨 ฟังก์ชันอัปเดตสต๊อกด่วน (ปุ่ม + / -)
    const handleUpdateStock = async (productId, currentStock, amount) => {
        const newStock = parseInt(currentStock || 0) + amount;
        if (newStock < 0) return;

        try {
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, { stock: newStock });
            
            // อัปเดต UI ทันที
            setProducts(prev => prev.map(p => 
                p.id === productId ? { ...p, stock: newStock } : p
            ));
            
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
            stock: p.stock, 
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
        if (!form.name || !form.price || !form.category) { addToast('กรุณากรอกข้อมูลให้ครบ', 'error'); return; }
        setSaving(true);
        const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 };
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
            addToast('ไม่สามารถบันทึกได้: ' + err.message, 'error');
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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">📦 จัดการสินค้าและสต๊อก</h1>
                <button onClick={openAdd} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95">
                    ➕ เพิ่มสินค้าใหม่
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">รูป</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">ชื่อสินค้า</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 text-center">จัดการสต๊อก</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">ราคา</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {products.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400">ยังไม่มีสินค้าในระบบ</td></tr>
                        ) : products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <img src={p.image || 'https://placehold.co/100/e8f5e9/2e7d32?text=P'} alt="" className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shadow-sm" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800 dark:text-gray-100">{p.name}</div>
                                    <div className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 px-2 py-0.5 rounded-md inline-block mt-1 font-bold">{p.category}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {/* 🚨 ปุ่มเพิ่ม/ลดสต๊อกแบบ Quick Actions */}
                                    <div className="flex items-center justify-center gap-3">
                                        <button 
                                            onClick={() => handleUpdateStock(p.id, p.stock, -1)}
                                            className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold"
                                        >
                                            -
                                        </button>
                                        <span className={`font-black text-lg min-w-[30px] text-center ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                                            {p.stock || 0}
                                        </span>
                                        <button 
                                            onClick={() => handleUpdateStock(p.id, p.stock, 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-black text-gray-700 dark:text-gray-200">{formatTHB(p.price)}</td>
                                <td className="px-6 py-4 text-right space-x-3">
                                    <button onClick={() => openEdit(p)} className="text-xs font-bold text-emerald-600 hover:underline">✏️ แก้ไข</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors">🗑️ ลบ</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal - เพิ่ม/แก้ไขสินค้า */}
            {modalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto p-10 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100">{editId ? '✏️ แก้ไขรายละเอียด' : '➕ เพิ่มสินค้าใหม่'}</h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-5">
                            <div><label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">ชื่อสินค้า *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:border-emerald-400 outline-none transition-all" placeholder="กรีนคอสออร์แกนิค" /></div>
                            <div><label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">รายละเอียด</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:border-emerald-400 outline-none transition-all resize-none" placeholder="ผักสดกรอบ ส่งตรงจากฟาร์ม..." /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">ราคา (บาท) *</label><input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:border-emerald-400 outline-none transition-all" /></div>
                                <div><label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">สต็อกเริ่มต้น *</label><input name="stock" type="number" value={form.stock} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:border-emerald-400 outline-none transition-all" /></div>
                            </div>
                            <div><label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">หมวดหมู่ *</label>
                                <select name="category" value={form.category} onChange={handleChange} required className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:border-emerald-400 outline-none transition-all">
                                    <option value="">เลือกหมวดหมู่</option>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">รูปภาพสินค้า</label>
                                <div className="border-4 border-dashed border-gray-50 dark:border-gray-800 rounded-[2rem] p-8 text-center cursor-pointer hover:border-emerald-400 transition-all relative overflow-hidden group">
                                    {form.image ? <img src={form.image} alt="preview" className="max-h-40 mx-auto rounded-2xl mb-4 group-hover:scale-105 transition-transform" /> : <div className="text-4xl mb-2">📷</div>}
                                    <p className="text-xs font-bold text-gray-400">คลิกเพื่ออัปโหลดรูปภาพ (ไม่เกิน 5MB)</p>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 font-bold hover:bg-gray-50 transition-all">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="flex-[2] py-4 rounded-2xl bg-emerald-600 text-white font-black shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:opacity-50">
                                    {saving ? 'กำลังบันทึก...' : editId ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้าเข้าสต๊อก'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
