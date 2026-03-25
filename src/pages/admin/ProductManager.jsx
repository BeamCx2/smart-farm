import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query } from 'firebase/firestore';
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
            addToast('ไม่สามารถโหลดข้อมูลได้: ' + err.message, 'error');
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
            addToast('ผิดพลาด: ' + e.message, 'error');
        }
    };

    const openAdd = () => { setEditId(null); setForm(emptyProduct); setModalOpen(true); };
    const openEdit = (p) => { 
        setEditId(p.id); 
        setForm({ 
            name: p.name, description: p.description || '', price: p.price, 
            stock: p.stock || 0, category: p.category, image: p.image || '', 
            video: p.video || '', status: p.status || 'active' 
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
        const data = { ...form, price: Number(form.price), stock: Number(form.stock) || 0 };
        try {
            if (editId) {
                await updateDoc(doc(db, 'products', editId), data);
                addToast('แก้ไขสำเร็จ!', 'success');
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
            addToast('ลบเรียบร้อย', 'info');
            load();
        } catch (err) { addToast('Error: ' + err.message, 'error'); }
    };

    if (loading) return <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;

    return (
        <div className="p-4 sm:p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">📦 จัดการสินค้า</h1>
                <button onClick={openAdd} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">➕ เพิ่มสินค้าใหม่</button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-left">สินค้า</th>
                            <th className="px-6 py-4 text-center">สต๊อก</th>
                            <th className="px-6 py-4 text-left">ราคา</th>
                            <th className="px-6 py-4 text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 flex items-center gap-3 font-bold">
                                    <img src={p.image || 'https://placehold.co/50'} className="w-10 h-10 rounded-lg object-cover" />
                                    {p.name}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, -1)} className="w-6 h-6 bg-red-50 text-red-500 rounded">-</button>
                                        <span className="w-8 font-bold">{p.stock || 0}</span>
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, 1)} className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded">+</button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold">{formatTHB(p.price)}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => openEdit(p)} className="text-emerald-600 font-bold">แก้ไข</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-400 font-bold">ลบ</button>
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
                        <h2 className="text-2xl font-black mb-6">{editId ? '✏️ แก้ไข' : '➕ เพิ่มใหม่'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">ชื่อสินค้า *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-5 py-3 rounded-xl border-2 dark:bg-gray-800 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">รายละเอียด</label><textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full px-5 py-3 rounded-xl border-2 dark:bg-gray-800 outline-none" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-400 uppercase">ราคา *</label><input name="price" type="number" value={form.price} onChange={handleChange} required className="w-full px-5 py-3 rounded-xl border-2 dark:bg-gray-800 outline-none" /></div>
                                <div><label className="text-xs font-bold text-gray-400 uppercase">สต็อก *</label><input name="stock" type="number" value={form.stock} onChange={handleChange} required className="w-full px-5 py-3 rounded-xl border-2 dark:bg-gray-800 outline-none" /></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">รูปภาพ</label>
                                <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer relative">
                                    {form.image && <img src={form.image} className="h-20 mx-auto mb-2 rounded-lg" />}
                                    <p className="text-[10px] text-gray-400">คลิกเพื่ออัปโหลด</p>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">หมวดหมู่</label>
                                <select name="category" value={form.category} onChange={handleChange} required className="w-full px-5 py-3 rounded-xl border-2 dark:bg-gray-800">
                                    <option value="">เลือกหมวด</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 font-bold border-2 rounded-xl">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="flex-[2] py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg">{saving ? 'กำลังบันทึก...' : 'ยืนยัน'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
