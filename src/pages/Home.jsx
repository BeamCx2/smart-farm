import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { formatTHB, CATEGORIES } from '../lib/utils';
import ProductCard from '../components/products/ProductCard';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            // 🚨 ถ้าไม่ได้ตั้งค่า Firebase ให้หยุดรอ (หรือโชว์แจ้งเตือน)
            if (!isFirebaseConfigured) {
                console.error("Firebase is not configured!");
                setLoading(false);
                return;
            }

            try {
                // ✅ ดึงเฉพาะจาก Firebase เท่านั้น
                const q = query(
                    collection(db, 'products'), 
                    where('status', '==', 'active'), 
                    orderBy('createdAt', 'desc'), 
                    limit(8)
                );
                
                const snap = await getDocs(q);
                const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setProducts(data);
            } catch (e) {
                console.error('Firestore fetch error:', e);
                // ❌ ลบระบบดึง Demo ออกแล้ว เพื่อให้บอสเห็นข้อมูลจริง
                setProducts([]); 
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-800 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
                        สดจากฟาร์ม<br />ถึงโต๊ะของคุณ 🌾
                    </h1>
                    <p className="text-lg md:text-xl opacity-80 max-w-xl mx-auto mb-8">
                        สินค้าเกษตรอินทรีย์คุณภาพ ปลูกด้วยใจ ราคาที่เข้าถึงได้
                    </p>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full shadow-xl shadow-amber-500/30 transition-all hover:-translate-y-0.5"
                    >
                        ช้อปเลย
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* Categories */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
                <h2 className="text-2xl font-bold text-center mb-2">🏷️ หมวดหมู่สินค้า</h2>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat}
                            to={`/products?category=${encodeURIComponent(cat)}`}
                            className="px-5 py-2.5 rounded-full border-2 border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-700 transition-all shadow-sm"
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Products */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
                <h2 className="text-2xl font-bold text-center mb-2 text-emerald-800">🌿 สินค้าแนะนำ</h2>
                <p className="text-gray-500 text-center mb-10 text-sm font-medium uppercase tracking-widest">Fresh from our heart to your table</p>
                
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold">ยังไม่มีสินค้าในระบบ Firebase ของคุณ</p>
                        <Link to="/admin" className="text-emerald-600 text-sm underline mt-2 inline-block">ไปเพิ่มสินค้าในหน้าแอดมิน</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                )}

                {!loading && products.length > 0 && (
                    <div className="text-center mt-12">
                        <Link to="/products" className="inline-flex items-center gap-2 px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full shadow-lg shadow-emerald-600/20 transition-all">
                            ดูสินค้าทั้งหมด
                        </Link>
                    </div>
                )}
            </section>
        </>
    );
}

// 🚨 ลบ getDemoProducts ออกไปเลยครับบอส จะได้ไม่สับสน
