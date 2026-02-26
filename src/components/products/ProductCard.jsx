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
            className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-1 flex flex-col"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                    src={product.image || `https://placehold.co/400x300/e8f5e9/2e7d32?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                {product.stock <= 0 && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                        สินค้าหมด
                    </span>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-white text-[11px] font-bold rounded-full">
                        เหลือ {product.stock} ชิ้น
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                    {product.category}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                    {product.name}
                </h3>
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 mt-auto pt-2">
                    {formatTHB(product.price)}
                </div>
            </div>

            {/* Action */}
            <div className="px-5 pb-5">
                <button
                    onClick={handleAdd}
                    disabled={product.stock <= 0}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all
            bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    🛒 เพิ่มลงตะกร้า
                </button>
            </div>
        </Link>
    );
}
