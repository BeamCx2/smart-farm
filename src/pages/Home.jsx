import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES } from '../lib/utils';
import { getCache, setCache, isCacheValid } from '../lib/cache';
import ProductCard from '../components/products/ProductCard';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const cacheKey = 'home_featured_products';
                if (isCacheValid(cacheKey)) {
                    const cachedData = getCache(cacheKey);
                    setProducts(cachedData);
                    setLoading(false);
                    return;
                }

                const q = query(
                    collection(db, 'products'),
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc'),
                    limit(8)
                );
                const snap = await getDocs(q);
                const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setCache(cacheKey, data);
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
            <section className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-3 rounded-full bg-red-500/10 text-red-700 px-4 py-2 text-sm font-semibold">
                                <span className="w-2 h-2 rounded-full bg-red-500 block" />
                                สินค้าขายดี ราคาสุดคุ้ม ทุกวัน
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                                สินค้าขายดี ราคาสุดคุ้ม
                                <span className="block text-red-600 mt-3">ผลไม้ตามฤดูกาล ผลไม้นำเข้า ราคาพิเศษ</span>
                            </h1>

                            <p className="max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300">
                                เว็บร้านค้าเกษตรสดใหม่ พร้อมโปรโมชั่นที่ตอบโจทย์ทั้งลูกค้าร้านและลูกค้าผู้ค้าส่ง
                                ซื้อวันนี้ส่งไว มีบริการติดตามออเดอร์และตรวจสอบค่าขนส่งทันที
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/products"
                                    className="inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all"
                                >
                                    เลือกชมสินค้า
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center rounded-full border border-red-600 px-8 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    สมัครสมาชิก
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-[2rem] bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-slate-900/40 p-8">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-300">ค้นหาสินค้า</label>
                                    <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18.5a7.5 7.5 0 006.15-3.85z" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="ค้นหาผัก ผลไม้ ชุดของขวัญ..."
                                            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">รวดเร็ว</div>
                                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">จัดส่งทันใจในพื้นที่กรุงเทพและปริมณฑล</p>
                                    </div>
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">ปลอดภัย</div>
                                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">สินค้าตรวจสอบคุณภาพก่อนจัดส่ง</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 shadow-sm">
                            <div className="text-sm uppercase tracking-[0.2em] text-red-600 font-bold">โปรโมชั่น</div>
                            <h2 className="mt-4 text-2xl font-black">ลดราคาพิเศษ</h2>
                            <p className="mt-3 text-slate-600 dark:text-slate-400">สินค้าคุณภาพ ราคาเบา ๆ พร้อมจัดส่งเร็ว</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 shadow-sm">
                            <div className="text-sm uppercase tracking-[0.2em] text-red-600 font-bold">บริการ</div>
                            <h2 className="mt-4 text-2xl font-black">เช็คค่าขนส่ง</h2>
                            <p className="mt-3 text-slate-600 dark:text-slate-400">รู้ราคาจัดส่งก่อนสั่งซื้อทุกครั้ง</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 shadow-sm">
                            <div className="text-sm uppercase tracking-[0.2em] text-red-600 font-bold">จัดส่ง</div>
                            <h2 className="mt-4 text-2xl font-black">ทั่วไทย</h2>
                            <p className="mt-3 text-slate-600 dark:text-slate-400">จัดส่งทั่วประเทศ พร้อมติดตามสถานะ</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black">หมวดหมู่สินค้า</h2>
                        <p className="text-slate-600 dark:text-slate-400">เลือกหมวดหมู่ที่ตรงใจได้อย่างรวดเร็ว</p>
                    </div>
                    <Link to="/products" className="text-sm font-semibold text-red-600 hover:text-red-700">
                        ดูสินค้าเพิ่มเติม →
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {CATEGORIES.map((category) => (
                        <Link
                            key={category}
                            to={`/products?category=${encodeURIComponent(category)}`}
                            className="group rounded-3xl border border-slate-200 bg-white p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
                        >
                            <div className="text-sm font-semibold text-red-600">หมวดหมู่</div>
                            <h3 className="mt-4 text-xl font-black text-slate-900 dark:text-white">{category}</h3>
                            <p className="mt-3 text-slate-600 dark:text-slate-400">ร้านค้าผัก ผลไม้สด พร้อมส่งตรงจากฟาร์ม</p>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black">สินค้าขายดี</h2>
                        <p className="text-slate-600 dark:text-slate-400">สินค้าแนะนำที่ลูกค้าชื่นชอบ</p>
                    </div>
                    <Link to="/products" className="text-sm font-semibold text-red-600 hover:text-red-700">
                        แสดงสินค้าทั้งหมด →
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="spinner"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <div className="text-6xl mb-4">🌱</div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">ยังไม่มีสินค้าในตอนนี้</p>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">ระบบกำลังเตรียมสินค้าให้คุณเร็ว ๆ นี้</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="rounded-3xl bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:shadow-slate-900/40">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
