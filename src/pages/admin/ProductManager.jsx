import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
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

    const load = async () => {
        try {
            setLoading(true);
            const snap = await getDocs(collection(db, 'products'));
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const sortedData = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setProducts(sortedData);
        } catch (err) {
            addToast('ไม่สามารถโหลดข้อมูลได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleUpdateStock = async (productId, currentStock, amount) => {
        const newStock = parseInt(currentStock || 0) + amount;
        if (newStock < 0) return;
        try {
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, { stock: newStock });
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
            addToast('อัปเดตสต๊อกแล้ว', 'success');
        } catch (e) {
            addToast('ผิดพลาด', 'error');
        }
    };

    const openAdd = () => { setEditId(null); setForm(emptyProduct); setModalOpen(true); };
    const openEdit = (p) => { 
        setEditId(p.id); 
        setForm({ ...p }); 
        setModalOpen(true); 
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setForm({ ...form, image: ev.target.result });
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const data = { ...form, price: Number(form.price), stock: Number(form.stock) || 0 };
        try {
            if (editId) {
                await updateDoc(doc(db, 'products', editId), data);
                addToast('บันทึกสำเร็จ!', 'success');
            } else {
                await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
                addToast('เพิ่มสำเร็จ!', 'success');
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
        if (!confirm('ต้องการลบ?')) return;
        try {
            await deleteDoc(doc(db, 'products', id));
            load();
            addToast('ลบเรียบร้อย', 'info');
        } catch (err) { addToast('Error', 'error'); }
    };

    if (loading) return <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;

    return (
        <div className="p-4 sm:p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-black text-emerald-800 tracking-tight">📦 จัดการสินค้า</h1>
                <button onClick={openAdd} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all">➕ เพิ่มสินค้าใหม่</button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-widest text-[10px]">สินค้า</th>
                            <th className="px-6 py-4 text-center font-bold text-gray-400 uppercase tracking-widest text-[10px]">สต๊อก</th>
                            <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-widest text-[10px]">ราคา</th>
                            <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase tracking-widest text-[10px]">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 flex items-center gap-4">
                                    <img src={p.image || 'https://placehold.co/100'} className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100" />
                                    <span className="font-black text-gray-700 dark:text-gray-200">{p.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, -1)} className="w-8 h-8 bg-red-50 text-red-500 rounded-xl font-black hover:bg-red-100 transition-colors">-</button>
                                        <span className={`w-8 text-center font-black text-lg ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>{p.stock || 0}</span>
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, 1)} className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-xl font-black hover:bg-emerald-100 transition-colors">+</button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-black text-gray-800 dark:text-white">{formatTHB(p.price)}</td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button onClick={() => openEdit(p)} className="text-emerald-600 font-black hover:underline">แก้ไข</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-300 font-black hover:text-red-500">ลบ</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100">{editId ? '✏️ แก้ไขข้อมูล' : '➕ เพิ่มสินค้าใหม่'}</h2>
                            <button onClick={() => setModalOpen(false)} className="text-3xl text-gray-300 hover:text-gray-600 transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* ชื่อสินค้า */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">ชื่อสินค้า *</label>
                                <input name="name" value={form.name} onChange={handleChange} required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-800 outline-none focus:border-emerald-400 transition-all font-bold" placeholder="ชื่อผักสด/สินค้า" />
                            </div>

                            {/* รายละเอียด */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">รายละเอียดสินค้า</label>
                                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-800 outline-none focus:border-emerald-400 transition-all font-medium" placeholder="อธิบายสินค้าเล็กน้อย..." />
                            </div>

                            {/* ราคาและสต็อก */}
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">ราคา (บาท) *</label><input name="price" type="number" value={form.price} onChange={handleChange} required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-800 outline-none focus:border-emerald-400 transition-all font-black" /></div>
                                <div><label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">สต็อกเริ่มต้น *</label><input name="stock" type="number" value={form.stock} onChange={handleChange} required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-800 outline-none focus:border-emerald-400 transition-all font-black" /></div>
                            </div>

                            {/* ✅ ส่วนจัดการรูปภาพ (เพิ่ม URL + Upload) */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">รูปภาพสินค้า (URL หรือ อัปโหลด)</label>
                                
                                {/* พิมพ์ URL โดยตรง */}
                                <input 
                                    name="image" 
                                    value={form.image} 
                                    onChange={handleChange} 
                                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-800 outline-none focus:border-emerald-400 transition-all text-xs font-medium mb-4" 
                                    placeholder="วาง URL รูปภาพที่นี่..." 
                                />

                                {/* หรืออัปโหลดไฟล์ */}
                                <div className="border-4 border-dashed border-gray-50 dark:border-gray-800 rounded-[2rem] p-6 text-center relative group overflow-hidden transition-all hover:border-emerald-200">
                                    {form.image ? (
                                        <div className="relative">
                                            <img src={form.image} alt="preview" className="h-32 mx-auto rounded-2xl mb-2 shadow-md group-hover:scale-105 transition-transform" />
                                            <p className="text-[10px] font-black text-gray-300 uppercase">เปลี่ยนรูปภาพได้ที่นี่</p>
                                        </div>
                                    ) : (
                                        <div className="py-4">
                                            <p className="text-4xl mb-2">📸</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">คลิกเพื่ออัปโหลดจากเครื่อง</p>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>

                            {/* หมวดหมู่ */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">หมวดหมู่สินค้า *</label>
                                <select name="category" value={form.category} onChange={handleChange} required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-800 outline-none focus:border-emerald-400 transition-all font-bold">
                                    <option value="">เลือกหมวดหมู่</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* ปุ่มกดยืนยัน */}
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 font-black border-2 border-gray-50 dark:border-gray-800 rounded-2xl hover:bg-gray-50 transition-all text-gray-400">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50">
                                    {saving ? 'กำลังบันทึก...' : editId ? '💾 บันทึกการแก้ไข' : '🚀 เพิ่มสินค้าเข้าฟาร์ม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
