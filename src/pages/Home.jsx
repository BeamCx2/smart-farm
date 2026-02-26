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
            if (!isFirebaseConfigured) {
                setProducts(getDemoProducts().slice(0, 8));
                setLoading(false);
                return;
            }
            try {
                const snap = await getDocs(query(collection(db, 'products'), where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(8)));
                setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.warn('Firestore not configured, using demo data');
                setProducts(getDemoProducts().slice(0, 8));
            }
            setLoading(false);
        }
        load();
    }, []);

    return (
        <>
            {/* Hero */}
            <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-800 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight animate-[fadeIn_0.6s_ease-out]">
                        สดจากฟาร์ม<br />ถึงโต๊ะของคุณ 🌾
                    </h1>
                    <p className="text-lg md:text-xl opacity-80 max-w-xl mx-auto mb-8 animate-[fadeIn_0.6s_ease-out_0.1s_both]">
                        สินค้าเกษตรอินทรีย์คุณภาพ ปลูกด้วยใจ ราคาที่เข้าถึงได้
                    </p>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full shadow-xl shadow-amber-500/30 transition-all hover:-translate-y-0.5 animate-[fadeIn_0.6s_ease-out_0.2s_both]"
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
                <p className="text-gray-500 dark:text-gray-400 text-center mb-10">เลือกหมวดที่คุณสนใจ</p>
                <div className="flex flex-wrap justify-center gap-3">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat}
                            to={`/products?category=${encodeURIComponent(cat)}`}
                            className="px-5 py-2.5 rounded-full border-2 border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
                <h2 className="text-2xl font-bold text-center mb-2">🌿 สินค้าแนะนำ</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-10">คัดสรรสินค้าคุณภาพเพื่อคุณ</p>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                )}
                {products.length > 0 && (
                    <div className="text-center mt-12">
                        <Link to="/products" className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow-lg shadow-emerald-600/20 transition-all">
                            ดูสินค้าทั้งหมด
                        </Link>
                    </div>
                )}
            </section>
        </>
    );
}

// Demo fallback when Firebase isn't configured
function getDemoProducts() {
    return [
        { id: 'd1', name: 'กรีนคอสออร์แกนิค', description: 'กรีนคอสออร์แกนิค เหมาะสำหรับสลัด', price: 89, stock: 45, category: 'ผักสด', image: 'https://lh5.googleusercontent.com/proxy/nx1HZFeOoQTwWu325jmT9YbS-u5207abHH6Vil0X7gYyZxdeQKPo2UL2LWitExrz6tJqEYboDcI13NhhATP6nSHT3oZsOF6WCe0xNTfyI-8LaS4Pe1gXDi_PIQEXhI0JIhkzBQXSeoHCXFHHDS8grGyZ5TcTWnGNKY1m3bJNzTZ4lAfM-J2w6IzC911i9iU', status: 'active' },
        { id: 'd2', name: 'ออร์แกนิค อินทรีย์', description: 'ออร์แกนิค อินทรีย์', price: 199, stock: 30, category: 'ปุ๋ย', image: 'https://itp1.itopfile.com/ImageServer/z_itp_27112022pfk3/0/0/%E0%B9%80%E0%B8%9A%E0%B8%AA%E0%B8%97%E0%B9%8C%E0%B8%9F%E0%B8%B2%E0%B8%A3%E0%B9%8C%E0%B8%A1%E0%B8%AD%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%81%E0%B8%81%E0%B8%99%E0%B8%B4%E0%B8%84(2)z-z327068866266.webp', status: 'active' },
        { id: 'd3', name: 'ต้นกล้าผักกรีนคอส', description: 'ต้นกล้าผักกรีนคอส ระยะเวลา 3 Week จำนวน', price: 2, stock: 60, category: 'ต้นกล้า', image: 'https://down-th.img.susercontent.com/file/th-11134207-7r98p-lpjfuer9dlfz3e', status: 'active' },
        { id: 'd4', name: 'เสาปลูกผัก', description: 'เสาปลูกผักแบบรายเดือน ', price: 400, stock: 20, category: 'อุปกรณ์การปลูก', image: 'https://image.made-in-china.com/202f0j00hjitcgdlCHRK/DIY-Garden-Vertical-Grow-Kit-Hydroponics-Aeroponic-Vegetable-Growing-Tower.webp', status: 'active' },
        { id: 'd5', name: 'กรีนโอ๊ค', description: 'บำรุงสายตา กรีนโอ๊คมีเบต้าแคโรทีน ชะลอการเสื่อมของจอประสาทตา ลดความเสื่อมของเซลล์ลูกตา ลดความเสี่ยงต่อการเป็นต้อกระจก', price: 79, stock: 55, category: 'ผักสด', image: 'https://mthai.com/app/uploads/2019/08/green-oak-1.jpg', status: 'active' },
        { id: 'd6', name: 'เรดโอ๊ค', description: 'ผักสลัดใบสีแดงเข้ม ก้านสีเขียว ลักษณะปลายใบหยักชัดเจน มีรสหวานกรอบ', price: 59, stock: 15, category: 'ผักสด', image: 'https://ofarmorganic.com/wp-content/uploads/2020/05/line_558174307007124.jpg', status: 'active' },
        { id: 'd7', name: 'ถาดเพาะ 60 หลุมกลม', description: 'ถาดเพาะ 60 หลุมกลม มีขอบ หนา 0.7มม. หลุม 5*5*4.5ซม. (1 กล่อง)', price: 129, stock: 40, category: 'อุปกรณ์การปลูก', image: 'https://www.koko.co.th/uploads/product/img/cover/l/525_60100.jpg', status: 'active' },
        { id: 'd8', name: 'ดินพีชมอส ดินปลูก', description: 'พีทมอสเป็นอินทรียวัตถุจากธรรมชาติ ซึ่งเป็นวัสดุที่เหมาะสมกับการเพาะปลูก', price: 25, stock: 35, category: 'อุปกรณ์การปลูก', image: 'https://s3gw.inet.co.th:8082/smegp-image-1/prod/V1/02082021300404u04jr0.jpg', status: 'active' },
        { id: 'd9', name: 'ต้นกล้า เรดโอ๊ค', description: 'สรรพคุณ เรดโอ๊ค พร้อมวิธีปลูก ผักสลัด ขาย สร้างรายได้เสริม', price: 2, stock: 12, category: 'ต้นกล้า', image: 'https://tamsuan.com/wp-content/uploads/2025/11/28112025-red-oak-03.webp', status: 'active' },
    //     { id: 'd10', name: 'บลูเบอร์รี่ออร์แกนิค', description: 'บลูเบอร์รี่จากธรรมชาติ หวานอมเปรี้ยว อุดมแอนตี้ออกซิแดนท์', price: 299, stock: 25, category: 'ผลไม้', image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&h=450&fit=crop', status: 'active' },
    //     { id: 'd11', name: 'นมวัวสด', description: 'นมสดจากฟาร์ม พาสเจอไรส์ ส่งถึงบ้านทุกวัน', price: 65, stock: 50, category: 'นม & ผลิตภัณฑ์นม', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&h=450&fit=crop', status: 'active' },
    //     { id: 'd12', name: 'อะโวคาโด (3 ลูก)', description: 'อะโวคาโดสุกพร้อมทาน เนื้อครีมมี่ สำหรับโทสต์และสลัด', price: 189, stock: 3, category: 'ผลไม้', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&h=450&fit=crop', status: 'active' },
    ];
}

export { getDemoProducts };
