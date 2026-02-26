import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    <div>
                        <div className="text-xl font-extrabold text-white mb-3">🌱 Smart Farm</div>
                        <p className="text-sm leading-relaxed max-w-xs">
                            สินค้าเกษตรอินทรีย์คุณภาพ จากฟาร์มถึงโต๊ะอาหาร ส่งตรงถึงหน้าบ้านคุณ
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white text-sm font-semibold mb-4">ลิงก์ด่วน</h4>
                        <div className="space-y-2 text-sm">
                            <Link to="/" className="block hover:text-emerald-400 transition-colors">หน้าแรก</Link>
                            <Link to="/products" className="block hover:text-emerald-400 transition-colors">สินค้าทั้งหมด</Link>
                            <Link to="/cart" className="block hover:text-emerald-400 transition-colors">ตะกร้าสินค้า</Link>
                            <Link to="/orders" className="block hover:text-emerald-400 transition-colors">คำสั่งซื้อ</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white text-sm font-semibold mb-4">หมวดหมู่</h4>
                        <div className="space-y-2 text-sm">
                            <Link to="/products" className="block hover:text-emerald-400 transition-colors">ผักสด</Link>
                            <Link to="/products" className="block hover:text-emerald-400 transition-colors">ปุ๋ย</Link>
                            <Link to="/products" className="block hover:text-emerald-400 transition-colors">อุปกรณ์การปลูก</Link>
                            <Link to="/products" className="block hover:text-emerald-400 transition-colors">ต้นกล้า</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white text-sm font-semibold mb-4">ติดต่อเรา</h4>
                        <div className="space-y-2 text-sm">
                            <p>📧 utcceng@smartfarm.co.th</p>
                            <p>📞 02-123-4567</p>
                            <p>📍 123 ถ.ดินแดง กรุงเทพฯ 10400</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
                    © 2026 Smart Farm. สงวนลิขสิทธิ์ทุกประการ 💚
                </div>
            </div>
        </footer>
    );
}
