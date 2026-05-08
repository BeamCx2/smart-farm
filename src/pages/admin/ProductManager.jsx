import { useState, useEffect } from 'react';
// ✅ ใช้ Firebase Realtime Database เท่านั้น
import { ref, onValue, set, push, update, remove, serverTimestamp } from 'firebase/database';
// ✅ ดึง rtdb มาจาก lib/firebase.js
import { rtdb as db } from '../../lib/firebase'; 
import { formatTHB, CATEGORIES } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

const emptyProduct = { 
    name: '', 
    description: '', 
    price: '', 
    stock: '', 
    category: '', 
    image: '', 
    status: 'active' 
};

export default function ProductManager() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyProduct);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    // 🔄 ดึงข้อมูลแบบ Real-time: ใครแก้ที่ไหน บอสเห็นที่นี่ทันที
    useEffect(() => {
        const productsRef = ref(db, 'products');
        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const productList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // เรียงจากล่าสุดขึ้นก่อน
                setProducts(productList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
            } else {
                setProducts([]);
            }
            setLoading(false);
        }, (err) => {
            addToast('โหลดข้อมูลล้มเหลว: ' + err.message, 'error');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ➕/➖ ปรับสต๊อกแบบด่วน
    const handleUpdateStock = async (productId, currentStock, amount) => {
        const newStock = parseInt(currentStock || 0) + amount;
        if (newStock < 0) return;
        try {
            await update(ref(db, `products/${productId}`), { stock: newStock });
            addToast('อัปเดตจำนวนสินค้าแล้ว', 'success');
        } catch (e) { addToast('อัปเดตไม่สำเร็จ', 'error'); }
    };

    const openAdd = () => { setEditId(null); setForm(emptyProduct); setModalOpen(true); };
    const openEdit = (p) => { setEditId(p.id); setForm({ ...p }); setModalOpen(true); };
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // 💾 บันทึกข้อมูล (Add/Update)
    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.category) return addToast('กรุณาเลือกหมวดหมู่', 'error');
        setSaving(true);

        const data = {
            ...form,
            price: Number(form.price) || 0,
            stock: Number(form.stock) || 0,
            updatedAt: serverTimestamp()
        };

        try {
            if (editId) {
                await update(ref(db, `products/${editId}`), data);
                addToast('แก้ไขข้อมูลเรียบร้อย!', 'success');
            } else {
                const newRef = push(ref(db, 'products'));
                await set(newRef, { ...data, createdAt: serverTimestamp() });
                addToast('เพิ่มสินค้าใหม่แล้ว!', 'success');
            }
            setModalOpen(false);
        } catch (err) {
            addToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('ยืนยันการลบสินค้าชิ้นนี้?')) return;
        try {
            await remove(ref(db, `products/${id}`));
            addToast('ลบสินค้าสำเร็จ', 'info');
        } catch (err) { addToast('ไม่สามารถลบได้', 'error'); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-emerald-900 font-bold animate-pulse">กำลังดึงข้อมูลจาก Farm...</p>
        </div>
    );

    return (
        <div className="p-4 sm:p-8 font-sans max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-emerald-900 tracking-tighter uppercase">📦 Product Hub</h1>
                    <p className="text-emerald-600 font-medium text-xs tracking-widest uppercase">Inventory Management</p>
                </div>
                <button 
                    onClick={openAdd} 
                    className="px-10 py-4 bg-emerald-600 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all uppercase text-xs tracking-widest"
                >
                    + Add New Item
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-6 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Product Details</th>
                                <th className="px-8 py-6 text-center font-black text-gray-400 uppercase tracking-widest text-[10px]">Stock Level</th>
                                <th className="px-8 py-6 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Price</th>
                                <th className="px-8 py-6 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-emerald-50/10 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-inner border border-gray-100 bg-gray-50 shrink-0">
                                                <img src={p.image || 'https://placehold.co/200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 text-lg leading-tight mb-1">{p.name}</p>
                                                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[9px] font-bold uppercase tracking-widest">{p.category}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-4 bg-gray-50/80 py-3 px-5 rounded-[1.5rem] inline-flex border border-gray-100">
                                            <button onClick={() => handleUpdateStock(p.id, p.stock, -1)} className="w-8 h-8 bg-white text-red-500 rounded-xl font-black shadow-sm border border-red-50 hover:bg-red-50">-</button>
                                            <span className={`min-w-[50px] text-center font-black text-xl ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-700'}`}>{p.stock || 0}</span>
                                            <button onClick={() => handleUpdateStock(p.id, p.stock, 1)} className="w-8 h-8 bg-white text-emerald-500 rounded-xl font-black shadow-sm border border-emerald-50 hover:bg-emerald-50">+</button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-black text-gray-900 text-lg">{formatTHB(p.price)}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-6">
                                        <button onClick={() => openEdit(p)} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 underline underline-offset-4">Edit</button>
                                        <button onClick={() => handleDelete(p.id)} className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-red-500 transition-colors">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] p-10 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{editId ? 'Modify Product' : 'Add New Item'}</h2>
                                <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-[0.3em]">Smart Farm Sync</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Product Name</label>
                                        <input name="name" value={form.name} onChange={handleChange} required className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-400 outline-none transition-all" placeholder="ผักกาดหอม..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Price (THB)</label>
                                            <input name="price" type="number" value={form.price} onChange={handleChange} required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black outline-none" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Stock Count</label>
                                            <input name="stock" type="number" value={form.stock} onChange={handleChange} required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black outline-none" placeholder="0" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                                        <select name="category" value={form.category} onChange={handleChange} required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black outline-none appearance-none cursor-pointer">
                                            <option value="">เลือกหมวดหมู่</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Image URL</label>
                                        <input name="image" value={form.image} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-[11px] font-bold outline-none mb-4" placeholder="https://..." />
                                        <div className="aspect-video bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden">
                                            {form.image ? (
                                                <img src={form.image} className="w-full h-full object-contain p-4" />
                                            ) : (
                                                <span className="text-5xl opacity-20 grayscale">🥗</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex gap-4 pt-8 border-t border-gray-50">
                                <button type="submit" disabled={saving} className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-200 transition-all disabled:opacity-50">
                                    {saving ? 'Processing...' : editId ? '💾 Update Inventory' : '🚀 Push to Farm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}