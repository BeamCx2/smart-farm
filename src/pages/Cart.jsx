import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatTHB } from '../lib/utils';

export default function Cart() {
    const { items, removeFromCart, updateQty, subtotal, shipping, total } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30">
                <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
                    <div className="text-center animate-fade-in-up">
                        <div className="text-8xl mb-8 animate-float">🛒</div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text">ตะกร้าว่างเปล่า</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                            ยังไม่มีสินค้าในตะกร้า มาค้นหาสินค้าเกษตรอินทรีย์คุณภาพดีกันเถอะ!
                        </p>
                        <Link
                            to="/products"
                            className="btn-primary px-8 py-4 text-white font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-1 inline-flex items-center gap-3 group"
                        >
                            <span>🛍️ เลือกซื้อสินค้า</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30">
            {/* Header */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="text-center animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text">🛒 ตะกร้าสินค้า</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        คุณมี {items.length} รายการในตะกร้า
                    </p>
                </div>
            </section>

            {/* Cart Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="glass rounded-3xl p-6 animate-fade-in-up card-hover"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex gap-6 items-center">
                                    {/* Product Image */}
                                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                                        <img
                                            src={item.image || 'https://placehold.co/100x100/e8f5e9/2e7d32?text=Product'}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors"></div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1 truncate">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                            {item.category}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
                                                <button
                                                    onClick={() => updateQty(item.id, item.qty - 1)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all font-semibold text-gray-600 dark:text-gray-400"
                                                >
                                                    −
                                                </button>
                                                <span className="w-12 h-10 flex items-center justify-center font-bold text-sm border-x border-gray-200 dark:border-gray-700">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() => updateQty(item.id, item.qty + 1)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all font-semibold text-gray-600 dark:text-gray-400"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                ต่อชิ้น
                                            </span>
                                        </div>
                                    </div>

                                    {/* Price & Actions */}
                                    <div className="text-right shrink-0">
                                        <div className="text-2xl font-black text-emerald-600 mb-2">
                                            {formatTHB(item.price * item.qty)}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                            {formatTHB(item.price)} × {item.qty}
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors font-medium inline-flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            ลบ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="glass rounded-3xl p-8 sticky top-24 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <h3 className="text-2xl font-black mb-6 gradient-text">📋 สรุปคำสั่งซื้อ</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">ราคาสินค้า</span>
                                    <span className="font-bold">{formatTHB(subtotal)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">ค่าจัดส่ง</span>
                                    <span className="font-bold text-emerald-600">
                                        {subtotal >= 500 ? 'ฟรี' : formatTHB(shipping)}
                                    </span>
                                </div>

                                {subtotal >= 500 && (
                                    <div className="text-sm text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
                                        🎉 รับส่งฟรี! (เมื่อซื้อครบ 500 บาท)
                                    </div>
                                )}

                                <hr className="border-gray-200 dark:border-gray-700" />

                                <div className="flex justify-between items-center text-xl font-black">
                                    <span className="gradient-text">ยอดรวม</span>
                                    <span className="gradient-text">{formatTHB(total)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    to="/checkout"
                                    className="btn-primary w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 inline-flex items-center justify-center gap-2 group"
                                >
                                    <span>💳 ดำเนินการชำระเงิน</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>

                                <Link
                                    to="/products"
                                    className="btn-secondary w-full py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl transition-all hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                    </svg>
                                    เลือกซื้อต่อ
                                </Link>
                            </div>

                            {/* Security badges */}
                            <div className="mt-6 pt-6 border-t border-white/20">
                                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <span className="text-green-500">🔒</span>
                                        ชำระเงินปลอดภัย
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-blue-500">🚚</span>
                                        ส่งเร็ว
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
