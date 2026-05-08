import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { CATEGORIES } from '../lib/utils';
import ProductCard from '../components/products/ProductCard';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(false);
    const activeCategory = searchParams.get('category') || 'ทั้งหมด';

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const loadProducts = async () => {
            try {
                const q = query(
                    collection(db, 'products'),
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc'),
                    limit(500)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

                setProducts(data);
                setLoading(false);
            } catch (error) {
                console.error("Firestore Error:", error);
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    const filteredAndSorted = useMemo(() => {
        let filtered = products.filter((p) => {
            const matchCat = activeCategory === 'ทั้งหมด' || p.category === activeCategory;
            const matchSearch = !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });

        // Sort products
        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 'price-high':
                filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                break;
        }

        return filtered;
    }, [products, activeCategory, search, sortBy]);

    const setCategory = (cat) => {
        if (cat === 'ทั้งหมด') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-800 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float"></div>
                    <div className="absolute top-20 right-20 w-16 h-16 bg-amber-400/20 rounded-full blur-lg animate-float" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        ค้นหาสินค้าที่คุณต้องการ
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text animate-fade-in-scale">
                        🛍️ สินค้าทั้งหมด
                    </h1>

                    <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
                        เลือกสินค้าเกษตรอินทรีย์คุณภาพจากฟาร์มของเรา
                        พร้อมส่งตรงถึงบ้านคุณอย่างรวดเร็ว
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 -mt-8 relative z-10">
                {/* Search & Filters Bar */}
                <div className="glass rounded-3xl p-6 mb-8 animate-fade-in-up">
                    <div className="flex flex-col lg:flex-row gap-6 items-center">
                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="ค้นหาผักสด ผลไม้..."
                                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm focus:border-emerald-400 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all shadow-lg"
                                />
                            </div>
                        </div>

                        {/* Sort & Filter Controls */}
                        <div className="flex items-center gap-4">
                            {/* Sort */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none px-4 py-3 pr-8 rounded-2xl border border-white/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm focus:border-emerald-400 outline-none transition-all shadow-lg"
                                >
                                    <option value="newest">ใหม่ล่าสุด</option>
                                    <option value="price-low">ราคาต่ำ-สูง</option>
                                    <option value="price-high">ราคาสูง-ต่ำ</option>
                                    <option value="name">ชื่อ A-Z</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden px-4 py-3 rounded-2xl border border-white/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap justify-center gap-3 mt-6 pt-6 border-t border-white/10">
                        {['ทั้งหมด', ...CATEGORIES].map((cat, index) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 card-hover animate-fade-in-scale ${
                                    activeCategory === cat
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                                }`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Filters - Desktop */}
                    <aside className={`hidden lg:block w-64 space-y-6 ${showFilters ? 'block' : ''}`}>
                        <div className="glass rounded-3xl p-6 animate-fade-in-up">
                            <h3 className="text-lg font-bold mb-4 gradient-text">🎯 กรองสินค้า</h3>

                            {/* Price Range */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    ช่วงราคา
                                </label>
                                <div className="space-y-2">
                                    <input type="range" min="0" max="1000" className="w-full accent-emerald-500" />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>0 บาท</span>
                                        <span>1000 บาท</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stock Status */}
                            <div className="space-y-3 mt-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    สถานะสินค้า
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                        <span className="ml-2 text-sm">พร้อมส่ง</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                        <span className="ml-2 text-sm">สินค้าแนะนำ</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <main className="flex-1">
                        {/* Results Count */}
                        <div className="flex justify-between items-center mb-6 animate-fade-in-up">
                            <p className="text-gray-600 dark:text-gray-400">
                                แสดง {filteredAndSorted.length} รายการ
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="spinner"></div>
                            </div>
                        ) : filteredAndSorted.length === 0 ? (
                            <div className="text-center py-20 glass rounded-3xl border border-dashed border-white/20 animate-fade-in-scale">
                                <div className="max-w-md mx-auto">
                                    <div className="text-6xl mb-4 animate-float">🥗</div>
                                    <h3 className="text-xl font-black mb-2 gradient-text">ไม่พบสินค้า</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นดูนะครับ
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSearch('');
                                            setCategory('ทั้งหมด');
                                        }}
                                        className="btn-primary px-6 py-3 text-white font-semibold rounded-2xl transition-all hover:-translate-y-0.5"
                                    >
                                        แสดงสินค้าทั้งหมด
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredAndSorted.map((p, index) => (
                                    <div
                                        key={p.id}
                                        className="animate-fade-in-scale card-hover"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <ProductCard product={p} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </section>
        </div>
    );
}