import { Link } from 'react-router-dom';
import { formatTHB } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();
    const { addToast } = useToast();

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock <= 0) return;
        addToCart(product, 1);
        addToast(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, 'success');
    };

    return (
        <Link
            to={`/products/${product.id}`}
            className="group bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] card-hover flex flex-col relative"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                <img
                    src={product.image || `https://placehold.co/400x300/e8f5e9/2e7d32?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Status badges */}
                {product.stock <= 0 && (
                    <span className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-lg animate-pulse">
                        สินค้าหมด
                    </span>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                    <span className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                        เหลือ {product.stock} ชิ้น
                    </span>
                )}

                {/* Hover overlay with add to cart */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <button
                        onClick={handleAdd}
                        disabled={product.stock <= 0}
                        className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-bold shadow-xl hover:bg-emerald-50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {product.stock <= 0 ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 flex flex-col">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full w-fit">
                    {product.category}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-3 leading-tight">
                    {product.name}
                </h3>
                <div className="text-xl font-black gradient-text mt-auto">
                    {formatTHB(product.price)}
                </div>
            </div>
        </Link>
    );
}
