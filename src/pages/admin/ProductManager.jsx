import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTHB, CATEGORIES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';
import { getDemoProducts } from '../Home';

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
            const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
            setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch {
            setProducts(getDemoProducts());
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => { setEditId(null); setForm(emptyProduct); setModalOpen(true); };
    const openEdit = (p) => { setEditId(p.id); setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category, image: p.image || '', video: p.video || '', status: p.status || 'active' }); setModalOpen(true); };

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
        } catch (err) {
            addToast('ไม่สามารถบันทึกได้: ' + err.message, 'error');
        }
        setSaving(false);
        setModalOpen(false);
        load();
    };

    const handleDelete = async (id) => {
        if (!confirm('คุณต้องการลบสินค้านี้?')) return;
        try {
            await deleteDoc(doc(db, 'products', id));
            addToast('ลบสินค้าสำเร็จ', 'info');
        } catch (err) {
            addToast('ไม่สามารถลบได้: ' + err.message, 'error');
        }
        load();
    };

    if (loading) {
        return <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl font-bold">📦 จัดการสินค้า</h1>
                <button onClick={openAdd} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all">
                    ➕ เพิ่มสินค้าใหม่
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-emerald-50 dark:bg-emerald-900/20">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">รูป</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">ชื่อสินค้า</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">หมวด</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">ราคา</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">สต็อก</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">สถานะ</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-500">ยังไม่มีสินค้า</td></tr>
                        ) : products.map((p) => (
                            <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-5 py-3"><img src={p.image || 'https://placehold.co/50/e8f5e9/2e7d32?text=P'} alt="" className="w-12 h-12 rounded-lg object-cover" /></td>
                                <td className="px-5 py-3 font-semibold">{p.name}</td>
                                <td className="px-5 py-3"><span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">{p.category}</span></td>
                                <td className="px-5 py-3 font-semibold">{formatTHB(p.price)}</td>
                                <td className="px-5 py-3"><span className={`font-bold ${p.stock <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>{p.stock}</span></td>
                                <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status === 'active' ? 'ใช้งาน' : 'ปิด'}</span></td>
                                <td className="px-5 py-3 text-right space-x-2">
                                    <button onClick={() => openEdit(p)} className="text-xs font-medium text-gray-500 hover:text-emerald-600 transition-colors">✏️ แก้ไข</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors">🗑️ ลบ</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">{editId ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}</h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div><label className="block text-sm font-semibold mb-1">ชื่อสินค้า *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none text-sm" placeholder="มะเขือเทศออร์แกนิค" /></div>
                            <div><label className="block text-sm font-semibold mb-1">รายละเอียด *</label><textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none text-sm resize-y" placeholder="อธิบายสินค้า..." /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold mb-1">ราคา (บาท) *</label><input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none text-sm" placeholder="99" /></div>
                                <div><label className="block text-sm font-semibold mb-1">จำนวนสต็อก *</label><input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none text-sm" placeholder="100" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold mb-1">หมวดหมู่ *</label>
                                    <select name="category" value={form.category} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none text-sm">
                                        <option value="">เลือกหมวด</option>
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-semibold mb-1">สถานะ</label>
                                    <select name="status" value={form.status} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none text-sm">
                                        <option value="active">ใช้งาน</option>
                                        <option value="inactive">ปิดใช้งาน</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">รูปสินค้า</label>
                                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 transition-all relative">
                                    {form.image && <img src={form.image} alt="preview" className="max-w-[200px] max-h-[150px] mx-auto mb-3 rounded-lg" />}
                                    <p className="text-sm text-gray-500">{form.image ? '📷 คลิกเพื่อเปลี่ยนรูป' : '📷 คลิกหรือลากไฟล์เพื่ออัปโหลด'}</p>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <input name="image" value={form.image} onChange={handleChange} className="w-full mt-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none text-sm" placeholder="หรือวาง URL รูปภาพ" />
                            </div>
                            <div><label className="block text-sm font-semibold mb-1">วิดีโอ URL</label><input name="video" value={form.video} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none text-sm" placeholder="https://youtube.com/watch?v=..." /></div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50">{saving ? 'กำลังบันทึก...' : editId ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
