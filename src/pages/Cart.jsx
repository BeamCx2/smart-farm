import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; // 🚨 เพิ่ม useAuth
import { formatTHB } from '../lib/utils';

export default function Cart() {
    const { items, removeFromCart, updateQty, subtotal, shipping, total } = useCart();
    const { user } = useAuth(); // 🚨 ดึงข้อมูล user มาเช็ค login
    const navigate = useNavigate(); // 🚨 เพิ่มตัวนำทาง

    if (items.length === 0) {
        return (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-xl font-bold mb-2">ตะกร้าว่างเปล่า</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">ยังไม่มีสินค้าในตะกร้า</p>
                <Link to="/products" className="inline-flex px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow-lg shadow-emerald-600/20 transition-all">
                    เลือกซื้อสินค้า
                </Link>
            </section>
        );
    }

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold mb-2">🛒 ตะกร้าสินค้า</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{items.length} รายการในตะกร้า</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* รายการสินค้า */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-5 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 items-center">
                            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                                <img src={item.image || 'https://placehold.co/100x100/e8f5e9/2e7d32?text=P'} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                                <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1">{formatTHB(item.price)}</div>
                                <div className="mt-3 inline-flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-gray-800 transition-all font-semibold">−</button>
                                    <span className="w-10 h-9 flex items-center justify-center font-bold text-sm border-x-2 border-gray-200 dark:border-gray-700">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-gray-800 transition-all font-semibold">+</button>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-bold mb-2">{formatTHB(item.price * item.qty)}</div>
                                <button onClick={() => removeFromCart(item.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                                    🗑️ ลบ
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* สรุปราคาและปุ่มดำเนินการ */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 h-fit lg:sticky lg:top-24">
                    <h3 className="font-bold text-lg mb-6">สรุปคำสั่งซื้อ</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">ราคารวม</span><span>{formatTHB(subtotal)}</span></div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">ค่าจัดส่ง</span>
                            <span>{shipping === 0 ? <span className="text-emerald-600 font-semibold">ฟรี</span> : formatTHB(shipping)}</span>
                        </div>
                        {shipping > 0 && <p className="text-xs text-gray-400 text-right">สั่งซื้อ ฿1,500 ขึ้นไป ส่งฟรี</p>}
                        <hr className="border-gray-200 dark:border-gray-700" />
                        <div className="flex justify-between text-base font-bold pt-2">
                            <span>ยอดรวม</span>
                            <span className="text-emerald-700 dark:text-emerald-400">{formatTHB(total)}</span>
                        </div>
                    </div>

                    {/* 🚨 ปุ่มที่แก้ไขตามโจทย์บอสครับ */}
                    <button
                        onClick={() => navigate(user ? '/checkout' : '/login')}
                        className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-[0.98]"
                    >
                        {user ? '💳 ดำเนินการชำระเงิน →' : '🔐 เข้าสู่ระบบเพื่อสั่งซื้อ'}
                    </button>

                    <Link to="/products" className="block w-full text-center mt-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-all">
                        ← เลือกซื้อต่อ
                    </Link>
                </div>
            </div>
        </section>
    );
}
