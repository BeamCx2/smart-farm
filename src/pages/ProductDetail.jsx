import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { formatTHB } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { getDemoProducts } from './Home';

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const { addToCart } = useCart();
    const { addToast } = useToast();

    useEffect(() => {
        async function load() {
            if (!isFirebaseConfigured) {
                const demo = getDemoProducts().find((p) => p.id === id);
                setProduct(demo || null);
                setLoading(false);
                return;
            }
            try {
                const snap = await getDoc(doc(db, 'products', id));
                if (snap.exists()) {
                    setProduct({ id: snap.id, ...snap.data() });
                } else {
                    throw new Error('not found');
                }
            } catch {
                const demo = getDemoProducts().find((p) => p.id === id);
                setProduct(demo || null);
            }
            setLoading(false);
        }
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
                <div className="text-5xl mb-4">😕</div>
                <h2 className="text-xl font-bold mb-2">ไม่พบสินค้า</h2>
                <Link to="/products" className="text-emerald-600 font-medium hover:underline">← กลับไปหน้าสินค้า</Link>
            </div>
        );
    }

    const handleAdd = () => {
        addToCart(product, qty);
        addToast(`เพิ่ม ${product.name} จำนวน ${qty} ชิ้นลงตะกร้าแล้ว`, 'success');
    };

    const getYoutubeEmbed = (url) => {
        if (!url) return null;
        let vid = '';
        if (url.includes('youtu.be/')) vid = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) vid = url.split('v=')[1].split('&')[0];
        return vid ? `https://www.youtube.com/embed/${vid}` : null;
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all mb-8">
                ← กลับไปหน้าสินค้า
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                {/* Gallery */}
                <div className="space-y-4">
                    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-md">
                        <img
                            src={product.image || `https://placehold.co/600x400/e8f5e9/2e7d32?text=${encodeURIComponent(product.name)}`}
                            alt={product.name}
                            className="w-full aspect-[4/3] object-cover"
                        />
                    </div>
                    {product.video && (
                        <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-md">
                            {(() => {
                                const embed = getYoutubeEmbed(product.video);
                                if (embed) {
                                    return <iframe src={embed} className="w-full aspect-video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
                                }
                                return <video controls src={product.video} className="w-full aspect-video" />;
                            })()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {product.category}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold mt-2 mb-4">{product.name}</h1>
                    <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mb-6">
                        {formatTHB(product.price)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                        {product.description}
                    </p>

                    <div className="flex flex-wrap gap-6 mb-8 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-2">
                            📦 สต็อก: <strong className={product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}>
                                {product.stock > 0 ? `${product.stock} ชิ้น` : 'สินค้าหมด'}
                            </strong>
                        </span>
                        <span className="flex items-center gap-2">🏷️ หมวด: <strong>{product.category}</strong></span>
                    </div>

                    {product.stock > 0 && (
                        <div className="flex items-center flex-wrap gap-4">
                            <div className="inline-flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    className="w-11 h-11 flex items-center justify-center text-lg font-semibold hover:bg-emerald-50 dark:hover:bg-gray-800 transition-all"
                                >−</button>
                                <span className="w-12 h-11 flex items-center justify-center font-bold border-x-2 border-gray-200 dark:border-gray-700">
                                    {qty}
                                </span>
                                <button
                                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                                    className="w-11 h-11 flex items-center justify-center text-lg font-semibold hover:bg-emerald-50 dark:hover:bg-gray-800 transition-all"
                                >+</button>
                            </div>
                            <button
                                onClick={handleAdd}
                                className="flex-1 min-w-[200px] py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                            >
                                🛒 เพิ่มลงตะกร้า — {formatTHB(product.price * qty)}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
