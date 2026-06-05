import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="relative mt-20 overflow-hidden">
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950"></div>

            {/* Decorative elements */}
            <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-10 right-10 w-24 h-24 bg-amber-400/10 rounded-full blur-lg"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
                {/* Newsletter Section */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <h3 className="text-3xl font-black text-white mb-4">📬 อย่าพลาดข่าวสารล่าสุด</h3>
                    <p className="text-gray-300 mb-8 max-w-md mx-auto">
                        สมัครรับข่าวสารสินค้าใหม่และโปรโมชั่นพิเศษก่อนใคร
                    </p>
                    <div className="max-w-md mx-auto flex gap-3">
                        <input
                            type="email"
                            placeholder="your@email.com"
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:border-emerald-400 focus:bg-white/20 outline-none transition-all"
                        />
                        <button className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95">
                            สมัครเลย
                        </button>
                    </div>
                </div>

                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-1 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-xl">🌱</span>
                            </div>
                            <div className="text-2xl font-black gradient-text">Smart Farm</div>
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            สินค้าเกษตรอินทรีย์คุณภาพสูง จากฟาร์มถึงโต๊ะอาหารของคุณ
                            พร้อมส่งตรงถึงหน้าบ้านอย่างรวดเร็วและปลอดภัย
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-emerald-500/20 transition-all hover:scale-110">
                                <span className="text-lg">📘</span>
                            </a>
                            <a href="#" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-emerald-500/20 transition-all hover:scale-110">
                                <span className="text-lg">📷</span>
                            </a>
                            <a href="#" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-emerald-500/20 transition-all hover:scale-110">
                                <span className="text-lg">🐦</span>
                            </a>
                            <a href="#" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-emerald-500/20 transition-all hover:scale-110">
                                <span className="text-lg">💬</span>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h4 className="text-white text-lg font-bold mb-6">🧭 ลิงก์ด่วน</h4>
                        <div className="space-y-3">
                            <Link to="/" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                หน้าแรก
                            </Link>
                            <Link to="/products" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                สินค้าทั้งหมด
                            </Link>
                            <Link to="/cart" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                ตะกร้าสินค้า
                            </Link>
                            <Link to="/orders" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                คำสั่งซื้อ
                            </Link>
                            <Link to="/admin" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                แอดมิน
                            </Link>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <h4 className="text-white text-lg font-bold mb-6">🏷️ หมวดหมู่สินค้า</h4>
                        <div className="space-y-3">
                            <Link to="/products?category=ผักสด" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                ผักสด
                            </Link>
                            <Link to="/products?category=ผลไม้" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                ผลไม้
                            </Link>
                            <Link to="/products?category=ปุ๋ย" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                ปุ๋ยอินทรีย์
                            </Link>
                            <Link to="/products?category=อุปกรณ์" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                อุปกรณ์การเกษตร
                            </Link>
                            <Link to="/products?category=ต้นกล้า" className="block text-gray-300 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                                ต้นกล้า
                            </Link>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <h4 className="text-white text-lg font-bold mb-6">📞 ติดต่อเรา</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-0.5">📧</span>
                                <div>
                                    <div className="text-gray-300 font-medium">อีเมล</div>
                                    <div className="text-gray-400 text-sm">support@smartfarm.co.th</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-0.5">📞</span>
                                <div>
                                    <div className="text-gray-300 font-medium">โทรศัพท์</div>
                                    <div className="text-gray-400 text-sm">02-123-4567</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-0.5">📍</span>
                                <div>
                                    <div className="text-gray-300 font-medium">ที่อยู่</div>
                                    <div className="text-gray-400 text-sm">123 ถ.ดินแดง<br />กรุงเทพฯ 10400</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-gray-400 text-sm">
                            © 2026 Smart Farm. สงวนลิขสิทธิ์ทุกประการ 💚
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <Link to="/privacy" className="hover:text-emerald-400 transition-colors">
                                นโยบายความเป็นส่วนตัว
                            </Link>
                            <Link to="/terms" className="hover:text-emerald-400 transition-colors">
                                เงื่อนไขการใช้งาน
                            </Link>
                            <Link to="/shipping" className="hover:text-emerald-400 transition-colors">
                                นโยบายการจัดส่ง
                            </Link>
                        </div>
                    </div>

                    {/* Trust badges */}
                    <div className="flex justify-center items-center gap-8 mt-8 opacity-60">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="text-green-400">🔒</span>
                            SSL Secured
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="text-blue-400">🚚</span>
                            Fast Delivery
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="text-amber-400">⭐</span>
                            100% Organic
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
