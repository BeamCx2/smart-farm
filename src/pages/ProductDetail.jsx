import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatTHB } from '../lib/utils';
import ProductCard from '../components/products/ProductCard';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [imageZoom, setImageZoom] = useState(false);
    const { addToCart } = useCart();
    const { addToast } = useToast();

    const loadRelatedProducts = useCallback(async (category, currentId) => {
        try {
            const q = query(
                collection(db, 'products'),
                where('category', '==', category),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(4)
            );

            const snapshot = await getDocs(q);
            const related = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(p => p.id !== currentId)
                .slice(0, 3);

            setRelatedProducts(related);
        } catch (error) {
            console.error("Error loading related products:", error);
        }
    }, []);

    useEffect(() => {
        if (!id) return;

        // ดึงข้อมูลสินค้า
        const unsubscribe = onSnapshot(doc(db, 'products', id), (docSnap) => {
            if (docSnap.exists()) {
                const productData = { id: docSnap.id, ...docSnap.data() };
                setProduct(productData);

                // ดึงสินค้าที่เกี่ยวข้อง
                loadRelatedProducts(productData.category, id);
            } else {
                addToast('ไม่พบข้อมูลสินค้านี้', 'error');
                navigate('/products');
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching product:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, navigate, addToast, loadRelatedProducts]);

    const handleAddToCart = () => {
        if (product && product.stock >= quantity) {
            addToCart(product, quantity);
            addToast(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, 'success');
        } else {
            addToast('สินค้าในสต๊อกไม่พอ', 'error');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-950 dark:to-emerald-950/30">
            <div className="text-center animate-fade-in-up">
                <div className="spinner mb-4"></div>
                <p className="text-emerald-600 font-bold animate-pulse">กำลังโหลดข้อมูลสินค้า...</p>
            </div>
        </div>
    );

    if (!product) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30">
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
                <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 animate-fade-in-up">
                    <Link to="/" className="hover:text-emerald-600 transition-colors">หน้าแรก</Link>
                    <span>/</span>
                    <Link to="/products" className="hover:text-emerald-600 transition-colors">สินค้า</Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{product.name}</span>
                </nav>
            </div>

            {/* Main Product Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="glass rounded-3xl p-8 md:p-12 animate-fade-in-up">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                        {/* Image Section */}
                        <div className="space-y-4">
                            <div
                                className="relative group cursor-zoom-in overflow-hidden rounded-3xl shadow-2xl"
                                onClick={() => setImageZoom(!imageZoom)}
                            >
                                <img
                                    src={product.image || 'https://placehold.co/600x600/e8f5e9/2e7d32?text=Product'}
                                    alt={product.name}
                                    className={`w-full aspect-square object-cover transition-all duration-500 ${imageZoom ? 'scale-150' : 'group-hover:scale-105'
                                        }`}
                                />

                                {/* Overlay badges */}
                                <div className="absolute top-6 left-6 space-y-2">
                                    <span className="px-4 py-2 bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-bold rounded-2xl shadow-lg">
                                        {product.category}
                                    </span>
                                    {product.stock <= 5 && product.stock > 0 && (
                                        <span className="px-4 py-2 bg-amber-500/90 backdrop-blur-sm text-white text-sm font-bold rounded-2xl shadow-lg animate-pulse">
                                            เหลือ {product.stock} ชิ้น
                                        </span>
                                    )}
                                    {product.stock <= 0 && (
                                        <span className="px-4 py-2 bg-red-500/90 backdrop-blur-sm text-white text-sm font-bold rounded-2xl shadow-lg">
                                            สินค้าหมด
                                        </span>
                                    )}
                                </div>

                                {/* Zoom indicator */}
                                <div className="absolute bottom-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text leading-tight">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="text-4xl font-black text-emerald-600">
                                        {formatTHB(product.price)}
                                    </span>
                                    <span className="text-lg text-gray-500 line-through">
                                        {formatTHB(product.price * 1.2)}
                                    </span>
                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-full">
                                        ประหยัด 17%
                                    </span>
                                </div>
                            </div>

                            {/* Description Card */}
                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">📝 รายละเอียดสินค้า</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {product.description || 'สินค้าเกษตรอินทรีย์คุณภาพสูง ปลูกด้วยความเอาใจใส่ ไม่ใช้สารเคมีใดๆ ปลอดภัยต่อสุขภาพและสิ่งแวดล้อม'}
                                </p>
                            </div>

                            {/* Quantity & Stock */}
                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-bold text-gray-800 dark:text-gray-200">จำนวน</span>
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${product.stock <= 5 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        }`}>
                                        คงเหลือ {product.stock} ชิ้น
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-12 h-12 flex items-center justify-center font-bold text-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            −
                                        </button>
                                        <span className="w-16 text-center font-black text-lg py-3 border-x border-gray-200 dark:border-gray-700">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                            className="w-12 h-12 flex items-center justify-center font-bold text-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">รวม</div>
                                        <div className="text-xl font-black text-emerald-600">
                                            {formatTHB(product.price * quantity)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock <= 0}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${product.stock <= 0
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white hover:shadow-xl hover:-translate-y-1 active:scale-95'
                                        }`}
                                >
                                    {product.stock <= 0 ? '❌ สินค้าหมดชั่วคราว' : `🛒 เพิ่มลงตะกร้า`}
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <button className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all hover:-translate-y-0.5 active:scale-95 border border-gray-300 dark:border-gray-700">
                                        ❤️ โปรด
                                    </button>
                                    <button className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all hover:-translate-y-0.5 active:scale-95 border border-gray-300 dark:border-gray-700">
                                        📤 แชร์
                                    </button>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20">
                                    <div className="text-2xl mb-2">🚚</div>
                                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">ส่งฟรี</div>
                                    <div className="text-xs text-gray-500">เมื่อซื้อครบ 500 บาท</div>
                                </div>
                                <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20">
                                    <div className="text-2xl mb-2">⭐</div>
                                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">คุณภาพรับประกัน</div>
                                    <div className="text-xs text-gray-500">อินทรีย์แท้ 100%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
                    <div className="text-center mb-12 animate-fade-in-up">
                        <h2 className="text-3xl md:text-4xl font-black mb-4 gradient-text">สินค้าที่เกี่ยวข้อง</h2>
                        <p className="text-gray-600 dark:text-gray-400">สินค้าอื่นๆ ในหมวดหมู่เดียวกัน</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {relatedProducts.map((p, index) => (
                            <div
                                key={p.id}
                                className="animate-fade-in-scale card-hover"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <ProductCard product={p} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
