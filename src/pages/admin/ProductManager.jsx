import { useState, useEffect } from 'react';
import { ref, onValue, set, push, update, remove, serverTimestamp } from 'firebase/database';
import { rtdb as db } from '../../lib/firebase';
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

    useEffect(() => {
        const productsRef = ref(db, 'products');
        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const productList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // เรียงลำดับจากใหม่ไปเก่า
                setProducts(productList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
            } else {
                setProducts([]);
            }
            setLoading(false);
        }, (err) => {
            addToast('โหลดข้อมูลไม่สำเร็จ', 'error');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUpdateStock = async (productId, currentStock, amount) => {
        const newStock = parseInt(currentStock || 0) + amount;
        if (newStock < 0) return;
        try {
            const productRef = ref(db, `products/${productId}`);
            await update(productRef, { stock: newStock });
            addToast('อัปเดตสต๊อกแล้ว', 'success');
        } catch (e) { addToast('ผิดพลาด', 'error'); }
    };

    const openAdd = () => { setEditId(null); setForm(emptyProduct); setModalOpen(true); };
    const openEdit = (p) => { setEditId(p.id); setForm({ ...p }); setModalOpen(true); };
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
        if (!form.category) return addToast('กรุณาเลือกหมวดหมู่', 'error');
        setSaving(true);

        const data = {
            ...form,
            price: Number(form.price),
            stock: Number(form.stock) || 0,
            updatedAt: serverTimestamp()
        };

        try {
            if (editId) {
                await update(ref(db, `products/${editId}`), data);
                addToast('บันทึกสำเร็จ!', 'success');
            } else {
                // เพิ่มสินค้าใหม่
                const newProductRef = push(ref(db, 'products'));
                await set(newProductRef, { ...data, createdAt: serverTimestamp() });
                addToast('เพิ่มสำเร็จ!', 'success');
            }
            setModalOpen(false);
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('ต้องการลบ?')) return;
        try {
            await remove(ref(db, `products/${id}`));
            addToast('ลบเรียบร้อย', 'info');
        } catch (err) { addToast('Error', 'error'); }
    };

    if (loading) return <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;

    return (
        <div className="p-4 sm:p-8 font-sans">
            <div className="flex items-center justify-between mb-10">
                <h1 className="text-2xl font-black text-emerald-900 tracking-tighter uppercase">📦 Product Hub</h1>
                <button onClick={openAdd} className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all uppercase text-[11px] tracking-widest">+ Add New</button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-5 text-left font-black text-gray-400 uppercase tracking-widest text-[9px]">Item</th>
                            <th className="px-6 py-4 text-center font-black text-gray-400 uppercase tracking-widest text-[9px]">Stock</th>
                            <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[9px]">Price</th>
                            <th className="px-6 py-4 text-right font-black text-gray-400 uppercase tracking-widest text-[9px]">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors group">
                                <td className="px-6 py-5 flex items-center gap-4">
                                    <img src={p.image || 'https://placehold.co/100'} className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100 group-hover:rotate-2 transition-transform" />
                                    <span className="font-black text-gray-800 text-base">{p.name}</span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="flex items-center justify-center gap-4 bg-gray-50/50 py-2 px-4 rounded-2xl inline-flex border border-gray-100">
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, -1)} className="w-8 h-8 bg-white text-red-500 rounded-xl font-black shadow-sm border border-red-50 hover:bg-red-50 transition-all">-</button>
                                        <span className={`min-w-[40px] text-center font-black text-lg ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>{p.stock || 0}</span>
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, 1)} className="w-8 h-8 bg-white text-emerald-500 rounded-xl font-black shadow-sm border border-emerald-50 hover:bg-emerald-50 transition-all">+</button>
                                    </div>
                                </td>
                                <td className="px-6 py-5 font-black text-gray-900 text-base">{formatTHB(p.price)}</td>
                                <td className="px-6 py-5 text-right space-x-6 uppercase text-[10px] font-black tracking-widest">
                                    <button onClick={() => openEdit(p)} className="text-emerald-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-500">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            { }
            {modalOpen && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    {/* ... (UI Modal ของบอส) ... */}
                    <div className="bg-white rounded-[3.5rem] p-10 max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black">{editId ? 'Modify Product' : 'Add Product'}</h2>
                            <button onClick={() => setModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave} className="overflow-y-auto flex-1 pr-2">
                            {/* ช่องกรอกข้อมูลต่างๆ เหมือนเดิมครับ */}
                            <input name="name" value={form.name} onChange={handleChange} placeholder="ชื่อสินค้า" className="w-full mb-4 p-4 bg-gray-50 rounded-2xl" />
                            <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="ราคา" className="w-full mb-4 p-4 bg-gray-50 rounded-2xl" />
                            <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="สต็อก" className="w-full mb-4 p-4 bg-gray-50 rounded-2xl" />
                            <select name="category" value={form.category} onChange={handleChange} className="w-full mb-4 p-4 bg-gray-50 rounded-2xl">
                                <option value="">เลือกหมวดหมู่</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input name="image" value={form.image} onChange={handleChange} placeholder="URL รูปภาพ" className="w-full mb-4 p-4 bg-gray-50 rounded-2xl" />
                            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black">
                                {saving ? 'Saving...' : 'Save Product'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}