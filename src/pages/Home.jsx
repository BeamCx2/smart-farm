import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { formatTHB, CATEGORIES } from '../lib/utils';
import ProductCard from '../components/products/ProductCard';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

// ในไฟล์ src/pages/Home.jsx
useEffect(() => {
    async function load() {
        try {
            setLoading(true);
            // ✅ [OPTIMIZATION] ใช้ orderBy + limit ระดับ query แล้ว
            const q = query(
                collection(db, 'products'),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(8) // ✅ จำกัดที่ query level
            );
            const snap = await getDocs(q);

            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    load();
}, []);

    return (
        <>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-800 text-white overflow-hidden min-h-screen flex items-center">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10 animate-float">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute top-40 right-20 w-24 h-24 bg-amber-400/20 rounded-full blur-lg"></div>
                    <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-20 right-10 w-20 h-20 bg-white/5 rounded-full blur-md"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        สินค้าเกษตรอินทรีย์คุณภาพสูง
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight gradient-text animate-fade-in-scale">
                        สดจากฟาร์ม<br />
                        <span className="text-amber-400">ถึงโต๊ะของคุณ</span> 🌾
                    </h1>

                    <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-10 leading-relaxed">
                        สินค้าเกษตรอินทรีย์คุณภาพ ปลูกด้วยใจ ราคาที่เข้าถึงได้
                        พร้อมส่งตรงถึงบ้านคุณอย่างรวดเร็ว
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/products"
                            className="btn-primary px-8 py-4 text-white font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-1 inline-flex items-center gap-3 group"
                        >
                            <span>🛒 ช้อปเลย</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>

                        <Link
                            to="/products"
                            className="btn-secondary px-8 py-4 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl transition-all hover:-translate-y-0.5"
                        >
                            ดูสินค้าทั้งหมด
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
                        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div className="text-3xl font-black text-amber-400 mb-1">100%</div>
                            <div className="text-sm opacity-80">อินทรีย์แท้</div>
                        </div>
                        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <div className="text-3xl font-black text-emerald-400 mb-1">24/7</div>
                            <div className="text-sm opacity-80">พร้อมให้บริการ</div>
                        </div>
                        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                            <div className="text-3xl font-black text-amber-400 mb-1">🚚</div>
                            <div className="text-sm opacity-80">ส่งฟรีทั่วไทย</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 -mt-16 relative z-10">
                <div className="glass rounded-3xl p-8 md:p-12 animate-fade-in-up">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-black mb-4 gradient-text">🏷️ หมวดหมู่สินค้า</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                            เลือกหมวดหมู่ที่คุณสนใจเพื่อค้นหาสินค้าที่ตรงใจ
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        {CATEGORIES.map((cat, index) => (
                            <Link
                                key={cat}
                                to={`/products?category=${encodeURIComponent(cat)}`}
                                className="group px-6 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg card-hover animate-fade-in-scale"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <span className="group-hover:scale-110 transition-transform inline-block">
                                    {cat}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-black mb-4 gradient-text">🌿 สินค้าแนะนำ</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                        Fresh from our heart to your table
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="spinner"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-16 glass rounded-3xl border border-dashed border-gray-300 dark:border-gray-600 animate-fade-in-scale">
                        <div className="max-w-md mx-auto">
                            <div className="text-6xl mb-4">🌱</div>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg mb-4">
                                ยังไม่มีสินค้าในระบบ
                            </p>
                            <Link
                                to="/admin"
                                className="btn-primary px-6 py-3 text-white font-semibold rounded-xl inline-block transition-all hover:-translate-y-0.5"
                            >
                                ไปเพิ่มสินค้าในหน้าแอดมิน
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((p, index) => (
                            <div
                                key={p.id}
                                className="animate-fade-in-scale card-hover"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <ProductCard product={p} />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && products.length > 0 && (
                    <div className="text-center mt-16 animate-fade-in-up">
                        <Link
                            to="/products"
                            className="btn-secondary px-8 py-4 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all hover:-translate-y-1 inline-flex items-center gap-3 group"
                        >
                            <span>ดูสินค้าทั้งหมด</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                )}
            </section>
        </>
    );
}
