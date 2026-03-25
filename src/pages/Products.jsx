import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'; // ✅ เปลี่ยนมาใช้ onSnapshot
import { db, isFirebaseConfigured } from '../lib/firebase';
import { CATEGORIES } from '../lib/utils';
import ProductCard from '../components/products/ProductCard';
import { getDemoProducts } from './Home';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const activeCategory = searchParams.get('category') || 'ทั้งหมด';

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setProducts(getDemoProducts());
            setLoading(false);
            return;
        }

        // 🚨 เปลี่ยนจาก getDocs เป็น onSnapshot เพื่อให้สต๊อกอัปเดตทันทีที่แอดมินแก้หลังบ้าน
        const q = query(
            collection(db, 'products'), 
            where('status', '==', 'active'), 
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setProducts(getDemoProducts());
            setLoading(false);
        });

        return () => unsubscribe(); // ล้างการเชื่อมต่อเมื่อปิดหน้า
    }, []);

    const filtered = useMemo(() => {
        return products.filter((p) => {
            const matchCat = activeCategory === 'ทั้งหมด' || p.category === activeCategory;
            const matchSearch = !search || 
                p.name.toLowerCase().includes(search.toLowerCase()) || 
                (p.description || '').toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [products, activeCategory, search]);

    const setCategory = (cat) => {
        if (cat === 'ทั้งหมด') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams);
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 min-h-screen">
            <h1 className="text-2xl font-black mb-2 text-gray-800 dark:text-gray-100 uppercase tracking-tight">🛍️ สินค้าทั้งหมด</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">เลือกซื้อผักสดและสินค้าเกษตรอินทรีย์คุณภาพส่งตรงจากฟาร์ม</p>

            {/* Search Box */}
            <div className="relative max-w-md mb-8 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาชื่อผัก หรือรายละเอียด..."
                    className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 transition-all outline-none shadow-sm"
                />
            </div>

            {/* Categories Filter */}
            <div className="flex flex-wrap gap-3 mb-10">
                {['ทั้งหมด', ...CATEGORIES].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeCategory === cat
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 -translate-y-0.5'
                            : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 hover:border-emerald-200 hover:text-emerald-600 shadow-sm'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-emerald-600 animate-pulse">กำลังเตรียมผักสดๆ ให้คุณ...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 bg-gray-50/50 dark:bg-gray-800/20 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="text-7xl mb-6">🥗</div>
                    <h3 className="text-xl font-black mb-2 uppercase">ไม่พบสินค้าที่คุณต้องการ</h3>
                    <p className="text-gray-400 max-w-xs mx-auto text-sm">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่สินค้าประเภทอื่นดูนะครับ</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filtered.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            )}
        </section>
    );
}
