import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { rtdb, isFirebaseConfigured } from '../lib/firebase';
import { CATEGORIES } from '../lib/utils';
import ProductCard from '../components/products/ProductCard';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const activeCategory = searchParams.get('category') || 'ทั้งหมด';

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const productsRef = ref(rtdb, 'products');

        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const productList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                const sortedData = productList
                    .filter(p => p.status === 'active')
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setProducts(sortedData);
            } else {
                setProducts([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Database Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
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
            <h1 className="text-xl font-black mb-1 text-gray-800 dark:text-gray-100 uppercase tracking-tight">🛍️ สินค้าทั้งหมด</h1>
            <p className="text-gray-400 mb-8 font-medium text-[10px] uppercase tracking-widest">Fresh & Organic Products</p>

            <div className="relative max-w-md mb-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาผักสด..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs focus:border-emerald-400 outline-none transition-all shadow-sm"
                />
            </div>

            <div className="flex flex-wrap gap-2 mb-10">
                {['ทั้งหมด', ...CATEGORIES].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                            activeCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-50 text-gray-400'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-emerald-50 border-t-emerald-500 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">🥗</div>
                    <h3 className="text-sm font-black text-gray-500">ไม่พบสินค้า</h3>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            )}
        </section>
    );
}