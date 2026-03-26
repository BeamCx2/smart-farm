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
        <div className="p-4 sm:p-8 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <h1 className="text-2xl font-black text-emerald-900 tracking-tighter uppercase">📦 Warehouse Manager</h1>
                <button onClick={openAdd} className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all uppercase text-[11px] tracking-widest">
                    + Add Product
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-5 text-left font-black text-gray-400 uppercase tracking-widest text-[9px]">Item Name</th>
                            <th className="px-6 py-4 text-center font-black text-gray-400 uppercase tracking-widest text-[9px]">Stock</th>
                            <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[9px]">Price</th>
                            <th className="px-6 py-4 text-right font-black text-gray-400 uppercase tracking-widest text-[9px]">Options</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors group">
                                <td className="px-6 py-5 flex items-center gap-4">
                                    <img src={p.image || 'https://placehold.co/100'} className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100 group-hover:scale-105 transition-transform" />
                                    <span className="font-black text-gray-800 text-base tracking-tight">{p.name}</span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="flex items-center justify-center gap-4 bg-gray-50/50 py-2 px-4 rounded-2xl inline-flex border border-gray-100 shadow-inner">
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, -1)} className="w-8 h-8 bg-white text-red-500 rounded-xl font-black shadow-sm hover:bg-red-50 active:scale-90 transition-all border border-red-50">-</button>
                                        <span className={`min-w-[40px] text-center font-black text-lg ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>{p.stock || 0}</span>
                                        <button onClick={() => handleUpdateStock(p.id, p.stock, 1)} className="w-8 h-8 bg-white text-emerald-500 rounded-xl font-black shadow-sm hover:bg-emerald-50 active:scale-90 transition-all border border-emerald-50">+</button>
                                    </div>
                                </td>
                                <td className="px-6 py-5 font-black text-gray-900 text-base">{formatTHB(p.price)}</td>
                                <td className="px-6 py-5 text-right space-x-6">
                                    <button onClick={() => openEdit(p)} className="text-emerald-600 font-black hover:underline uppercase text-[10px] tracking-widest">Edit</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-gray-300 font-black hover:text-red-500 uppercase text-[10px] tracking-widest transition-colors">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 🚀 Single Page Modal (2 Columns) */}
            {modalOpen && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] p-10 max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-white/20 scale-in-center overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{editId ? 'Modify Product' : 'Add New Item'}</h2>
                                <p className="text-[10px] font-black text-emerald-600 tracking-[0.3em] uppercase mt-1">Smart Farm Management System</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-inner text-xl">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-hidden flex-1 px-1">
                                
                                {/* Left Side: Form Data */}
                                <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">ชื่อสินค้า *</label>
                                        <input name="name" value={form.name} onChange={handleChange} required className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-400 outline-none transition-all shadow-inner" placeholder="ระบุชื่อผักสด/สินค้า..." />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">รายละเอียดสินค้า</label>
                                        <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-400 outline-none resize-none transition-all shadow-inner" placeholder="อธิบายสินค้าเล็กน้อย..." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">ราคา (บาท) *</label>
                                            <input name="price" type="number" value={form.price} onChange={handleChange} required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black outline-none shadow-inner" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">สต็อกเริ่มต้น *</label>
                                            <input name="stock" type="number" value={form.stock} onChange={handleChange} required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black outline-none shadow-inner" placeholder="0" />
                                        </div>
                                    </div>

                                    {/* ✨ Custom Select UI (แก้เรื่องกินขอบ) */}
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">หมวดหมู่สินค้า *</label>
                                        <div className="relative group/select">
                                            <select 
                                                name="category" 
                                                value={form.category} 
                                                onChange={handleChange} 
                                                required 
                                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-black outline-none appearance-none cursor-pointer transition-all focus:bg-white focus:border-emerald-400 shadow-inner"
                                            >
                                                <option value="" disabled>เลือกหมวดหมู่</option>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-hover/select:text-emerald-500 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Media Management */}
                                <div className="flex flex-col space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">รูปภาพสินค้า</label>
                                        <input name="image" value={form.image} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-[11px] font-bold outline-none mb-4 shadow-inner" placeholder="วาง URL รูปภาพที่นี่..." />
                                        
                                        <div className="flex-1 min-h-[280px] border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50 flex flex-col items-center justify-center group hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer relative overflow-hidden shadow-inner">
                                            {form.image ? (
                                                <div className="relative w-full h-full p-6">
                                                    <img src={form.image} alt="preview" className="w-full h-full object-contain rounded-3xl" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white font-black text-xs uppercase tracking-widest">Change Photo</div>
                                                </div>
                                            ) : (
                                                <div className="text-center p-8 transition-transform group-hover:scale-110">
                                                    <span className="text-5xl mb-4 block">📸</span>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Image</p>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="mt-10 flex gap-4 pt-8 border-t border-gray-50 items-center">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-red-500 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-[2.5] py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50">
                                    {saving ? 'Processing...' : editId ? '💾 Update Changes' : '🚀 Publish Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
