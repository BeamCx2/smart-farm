import { useState, useEffect } from 'react';
import {
    collection, onSnapshot, addDoc, updateDoc, deleteDoc,
    doc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { ...form, price: Number(form.price), stock: Number(form.stock), updatedAt: serverTimestamp() };
            if (editId) {
                await updateDoc(doc(db, 'products', editId), data);
                addToast('อัปเดตสินค้าแล้ว', 'success');
            } else {
                await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
                addToast('เพิ่มสินค้าใหม่แล้ว', 'success');
            }
            setModalOpen(false);
        } catch (err) { addToast(err.message, 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (confirm('ลบสินค้าชิ้นนี้?')) await deleteDoc(doc(db, 'products', id));
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse">LOADING FARM DATA...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-gray-900 dark:to-emerald-900 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-xl animate-float"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-amber-200/40 rounded-full blur-lg animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-emerald-300/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 right-10 w-20 h-20 bg-white/20 rounded-full blur-md animate-float" style={{ animationDelay: '0.5s' }}></div>
            </div>

            <div className="relative z-10 p-4 sm:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 animate-fade-in-up">
                    <div>
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto sm:mx-0 mb-6 shadow-xl animate-float">
                            <span className="text-3xl">📦</span>
                        </div>
                        <h1 className="text-4xl font-black gradient-text mb-2">จัดการสินค้า</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">เพิ่ม แก้ไข และจัดการสินค้าทั้งหมดในร้านค้า</p>
                    </div>

                    <button
                        onClick={() => { setEditId(null); setForm({ name: '', description: '', price: '', stock: '', category: '', image: '', status: 'active' }); setModalOpen(true); }}
                        className="btn-primary px-8 py-4 text-white font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-1 inline-flex items-center gap-3"
                    >
                        <span className="text-xl">+</span>
                        เพิ่มสินค้าใหม่
                    </button>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {products.map((product, index) => (
                        <div
                            key={product.id}
                            className="glass rounded-3xl p-6 shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up group"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Product Image */}
                            <div className="w-full h-48 bg-white/10 rounded-2xl mb-4 overflow-hidden">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        🌱
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{product.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{product.description}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                        {formatTHB(product.price)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        คงเหลือ: <span className="font-bold text-emerald-600">{product.stock}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest
                                        ${product.category ? 'bg-emerald-500/20 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-500/20 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400'}`}>
                                        {product.category || 'ไม่มีหมวดหมู่'}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest
                                        ${product.status === 'active' ? 'bg-green-500/20 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-500/20 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                        {product.status === 'active' ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setEditId(product.id); setForm(product); setModalOpen(true); }}
                                    className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-3 px-4 font-bold rounded-xl transition-all hover:bg-emerald-200 dark:hover:bg-emerald-900/50 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
                                >
                                    <span>✏️</span>
                                    แก้ไข
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold rounded-xl transition-all hover:bg-red-200 dark:hover:bg-red-900/50 hover:-translate-y-0.5 inline-flex items-center justify-center"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {products.length === 0 && (
                    <div className="glass rounded-3xl p-12 text-center animate-fade-in-up">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-float">
                            <span className="text-4xl">📦</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-4">ยังไม่มีสินค้า</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">เริ่มเพิ่มสินค้าแรกของคุณเพื่อเริ่มขาย</p>
                        <button
                            onClick={() => { setEditId(null); setForm({ name: '', description: '', price: '', stock: '', category: '', image: '', status: 'active' }); setModalOpen(true); }}
                            className="btn-primary px-8 py-4 text-white font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-1 inline-flex items-center gap-3"
                        >
                            <span className="text-xl">+</span>
                            เพิ่มสินค้าแรก
                        </button>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 z-[999] animate-in fade-in scale-in-center">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl dark:shadow-2xl dark:shadow-black/50 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                                    {editId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                                </h2>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-all hover:scale-110"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Product Name */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        ชื่อสินค้า <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 outline-none transition-all"
                                        placeholder="ชื่อสินค้า..."
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        รายละเอียดสินค้า
                                    </label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 outline-none transition-all resize-none"
                                        placeholder="รายละเอียดสินค้า..."
                                    />
                                </div>

                                {/* Price and Stock */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            ราคา (บาท) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={form.price}
                                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 outline-none transition-all"
                                            placeholder="0"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            จำนวนสต็อก <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={form.stock}
                                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 outline-none transition-all"
                                            placeholder="0"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        หมวดหมู่ <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 outline-none transition-all"
                                        required
                                    >
                                        <option value="">เลือกหมวดหมู่</option>
                                        {CATEGORIES.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Image URL */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        URL รูปภาพ
                                    </label>
                                    <input
                                        type="url"
                                        value={form.image}
                                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 outline-none transition-all"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                        สถานะ
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="active"
                                                checked={form.status === 'active'}
                                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">ใช้งาน</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="inactive"
                                                checked={form.status === 'inactive'}
                                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">ปิดใช้งาน</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold rounded-xl transition-all hover:bg-gray-300 dark:hover:bg-gray-600 hover:-translate-y-0.5"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="spinner w-5 h-5"></div>
                                                <span>กำลังบันทึก...</span>
                                            </>
                                        ) : (
                                            <span>{editId ? 'อัปเดต' : 'เพิ่ม'}สินค้า</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}