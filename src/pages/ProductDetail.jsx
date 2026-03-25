import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore'; // ✅ ใช้ onSnapshot เพื่อให้สต๊อกอัปเดตเรียลไทม์
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatTHB } from '../lib/utils';

// ❌ ลบ import { getDemoProducts } ออกแล้วครับบอส

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const { addToast } = useToast();

    useEffect(() => {
        if (!id) return;

        // ✅ ดึงข้อมูลสินค้าแบบ Real-time จาก Firebase
        const unsubscribe = onSnapshot(doc(db, 'products', id), (docSnap) => {
            if (docSnap.exists()) {
                setProduct({ id: docSnap.id, ...docSnap.data() });
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
    }, [id, navigate, addToast]);

    const handleAddToCart = () => {
        if (product && product.stock >= quantity) {
            addToCart(product, quantity);
            addToast(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, 'success');
        } else {
            addToast('สินค้าในสต๊อกไม่พอ', 'error');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-emerald-600 font-bold">กำลังโหลดข้อมูลผักสด...</div>;
    if (!product) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                
                {/* Image Section */}
                <div className="relative group">
                    <img 
                        src={product.image || 'https://placehold.co/600x600?text=Product'} 
                        alt={product.name} 
                        className="w-full aspect-square object-cover rounded-[2.5rem] shadow-lg transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute top-6 left-6">
                        <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-xs font-black text-emerald-700 shadow-sm uppercase tracking-widest">
                            {product.category}
                        </span>
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex flex-col justify-center">
                    <h1 className="text-4xl font-black mb-4 text-gray-800 dark:text-gray-100">{product.name}</h1>
                    <p className="text-3xl font-black text-emerald-600 mb-6">{formatTHB(product.price)}</p>
                    
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl mb-8">
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            {product.description || 'ไม่มีรายละเอียดสินค้า'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-1 bg-white dark:bg-gray-800">
                            <button 
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-12 h-12 flex items-center justify-center font-bold text-xl hover:bg-gray-50 rounded-xl transition-colors"
                            >-</button>
                            <span className="w-12 text-center font-black text-lg">{quantity}</span>
                            <button 
                                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                className="w-12 h-12 flex items-center justify-center font-bold text-xl hover:bg-gray-50 rounded-xl transition-colors"
                            >+</button>
                        </div>
                        <span className={`text-sm font-bold ${product.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                            📦 คงเหลือ {product.stock} ชิ้น
                        </span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock <= 0}
                        className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl ${
                            product.stock <= 0 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95'
                        }`}
                    >
                        {product.stock <= 0 ? '❌ สินค้าหมดชั่วคราว' : `🛒 เพิ่มลงตะกร้า — ${formatTHB(product.price * quantity)}`}
                    </button>
                </div>
            </div>
        </section>
    );
}
