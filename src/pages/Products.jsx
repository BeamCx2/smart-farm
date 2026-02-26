import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
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
        async function load() {
            if (!isFirebaseConfigured) {
                setProducts(getDemoProducts());
                setLoading(false);
                return;
            }
            try {
                const snap = await getDocs(query(collection(db, 'products'), where('status', '==', 'active'), orderBy('createdAt', 'desc')));
                setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch {
                setProducts(getDemoProducts());
            }
            setLoading(false);
        }
        load();
    }, []);

    const filtered = useMemo(() => {
        return products.filter((p) => {
            const matchCat = activeCategory === 'ทั้งหมด' || p.category === activeCategory;
            const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold mb-2">🛍️ สินค้าทั้งหมด</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">เลือกซื้อสินค้าเกษตรอินทรีย์คุณภาพ</p>

            {/* Search */}
            <div className="relative max-w-md mb-6">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาสินค้า..."
                    className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 transition-all outline-none"
                />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-8">
                {['ทั้งหมด', ...CATEGORIES].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-5 py-2 rounded-full text-sm font-medium border-2 transition-all ${activeCategory === cat
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white dark:bg-gray-900'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold mb-2">ไม่พบสินค้า</h3>
                    <p className="text-gray-500 dark:text-gray-400">ลองค้นหาหรือเลือกหมวดอื่น</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            )}
        </section>
    );
}
