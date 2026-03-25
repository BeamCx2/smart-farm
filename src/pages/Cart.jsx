import { Link, useNavigate, useLocation } from 'react-router-dom'; // 🚨 เพิ่ม useLocation
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatTHB } from '../lib/utils';
import { MinusSmallIcon, PlusSmallIcon, TrashIcon } from '@heroicons/react/24/outline'; // 🚨 เพิ่ม Icon (ถ้าไม่มีให้ลง @heroicons/react)

export default function Cart() {
    const { items, removeFromCart, updateQty, subtotal, shipping, total } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // 🚨 เพิ่มตัวแปร location เพื่อเช็ค Path

    // 🚨 แก้ไขเงื่อนไขการแสดงผลหน้า "ตะกร้าว่างเปล่า"
    if (items.length === 0 && location.pathname === '/cart') {
        return (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
                <div className="flex justify-center mb-6">
                    <img src="https://placehold.co/150/white/white?text=Empty" alt="empty cart" className="w-32 h-32" /> 
                    {/* หรือใช้ SVG ตะกร้าของบอสอันเดิมได้เลยครับ */}
                </div>
                <h2 className="text-xl font-bold mb-2">ตะกร้าว่างเปล่า</h2>
                <p className="text-gray-500 mb-8">ยังไม่มีสินค้าในตะกร้า</p>
                <Link to="/" className="inline-block px-10 py-4 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all">
                    เลือกซื้อสินค้า
                </Link>
            </section>
        );
    }

    // 🚨 สำคัญมาก: ถ้ารายการเป็น 0 แต่เราอยู่ที่หน้า /checkout (หรือหน้าอื่นๆ)
    // ให้มัน return null หรือไม่ต้องแสดงผลอะไร เพื่อให้หน้าชำระเงินแสดงผลได้ปกติครับ
    if (items.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold mb-10 text-emerald-700">🛒 ตะกร้าสินค้าของคุณ</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Items */}
                <div className="md:col-span-2 space-y-5">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-6 bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 items-center">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                                <img src={item.image || 'https://placehold.co/300x300?text=Product'} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                                <p className="text-emerald-600 font-black text-xl mt-1">{formatTHB(item.price)}</p>
                                <div className="mt-4 inline-flex items-center gap-1 border-2 border-gray-100 rounded-full p-1">
                                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 hover:bg-emerald-50 text-emerald-600">
                                        <MinusSmallIcon className="w-5 h-5" />
                                    </button>
                                    <span className="w-10 text-center font-bold">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 hover:bg-emerald-50 text-emerald-600">
                                        <PlusSmallIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right shrink-0 ml-auto">
                                <p className="font-bold text-xl mb-3">{formatTHB(item.price * item.qty)}</p>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2 rounded-full hover:bg-red-50">
                                    <TrashIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-lg shadow-gray-50 h-fit">
                    <h3 className="font-bold text-xl mb-6">สรุปคำสั่งซื้อ</h3>
                    <div className="space-y-4 text-gray-600 mb-8">
                        <div className="flex justify-between"><span>ราคาสินค้า</span><span className="font-semibold text-black">{formatTHB(subtotal)}</span></div>
                        <div className="flex justify-between"><span>ค่าจัดส่ง</span><span className="font-semibold text-black">{shipping === 0 ? <span className="text-emerald-600">ฟรี</span> : formatTHB(shipping)}</span></div>
                        <div className="flex justify-between text-lg font-bold border-t pt-4">
                            <span>ยอดรวม</span>
                            <span className="text-emerald-700 text-2xl">{formatTHB(total)}</span>
                        </div>
                    </div>
                    <Link
                        to="/checkout"
                        className="block w-full text-center py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                    >
                        ดำเนินการชำระเงิน
                    </Link>
                </div>
            </div>
        </section>
    );
}
