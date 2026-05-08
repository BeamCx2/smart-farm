import { useState, useEffect } from 'react';
import { ref, onValue, set, push, update, remove, serverTimestamp } from 'firebase/database';
import { rtdb } from '../../lib/firebase'; 
import { formatTHB, CATEGORIES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

export default function ProductManager() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', image: '', status: 'active' });
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const productsRef = ref(rtdb, 'products');
        return onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                setProducts(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
            } else { setProducts([]); }
            setLoading(false);
        });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { ...form, price: Number(form.price), stock: Number(form.stock), updatedAt: serverTimestamp() };
            if (editId) {
                await update(ref(rtdb, `products/${editId}`), data);
                addToast('อัปเดตสินค้าแล้ว', 'success');
            } else {
                const newRef = push(ref(rtdb, 'products'));
                await set(newRef, { ...data, createdAt: serverTimestamp() });
                addToast('เพิ่มสินค้าใหม่แล้ว', 'success');
            }
            setModalOpen(false);
        } catch (err) { addToast(err.message, 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (confirm('ลบสินค้าชิ้นนี้?')) await remove(ref(rtdb, `products/${id}`));
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse">LOADING FARM DATA...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-black uppercase">📦 Product Hub</h1>
                <button onClick={() => { setEditId(null); setForm({ name: '', description: '', price: '', stock: '', category: '', image: '', status: 'active' }); setModalOpen(true); }} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black">+ ADD NEW</button>
            </div>
            {/* ตารางแสดงผล */}
            <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                        <tr><th className="p-6">Product</th><th className="p-6">Stock</th><th className="p-6">Price</th><th className="p-6 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-6 font-bold">{p.name}</td>
                                <td className="p-6 font-black text-emerald-600">{p.stock}</td>
                                <td className="p-6 font-bold">{formatTHB(p.price)}</td>
                                <td className="p-6 text-right space-x-4">
                                    <button onClick={() => { setEditId(p.id); setForm(p); setModalOpen(true); }} className="text-emerald-600 font-black text-xs uppercase">Edit</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-300 hover:text-red-600 font-black text-xs uppercase">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal ก๊อปปี้ UI เดิมของบอสมาวางได้เลยครับ ตรงนี้ผมรวบฟังก์ชันไว้ให้แล้ว */}
            {modalOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-[3rem] max-w-2xl w-full">
                        <form onSubmit={handleSave} className="space-y-4">
                            <input name="name" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} placeholder="ชื่อสินค้า" className="w-full p-4 bg-gray-50 rounded-2xl" required />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="price" type="number" value={form.price} onChange={(e)=>setForm({...form, price: e.target.value})} placeholder="ราคา" className="w-full p-4 bg-gray-50 rounded-2xl" required />
                                <input name="stock" type="number" value={form.stock} onChange={(e)=>setForm({...form, stock: e.target.value})} placeholder="สต็อก" className="w-full p-4 bg-gray-50 rounded-2xl" required />
                            </div>
                            <select value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl" required>
                                <option value="">เลือกหมวดหมู่</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input name="image" value={form.image} onChange={(e)=>setForm({...form, image: e.target.value})} placeholder="URL รูปภาพ" className="w-full p-4 bg-gray-50 rounded-2xl" />
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={()=>setModalOpen(false)} className="flex-1 font-black text-gray-400">CANCEL</button>
                                <button type="submit" className="flex-[2] p-4 bg-emerald-600 text-white rounded-2xl font-black">{saving ? 'SAVING...' : 'SAVE PRODUCT'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}