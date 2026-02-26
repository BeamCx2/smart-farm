import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

const NAV_LINKS = [
    { to: '/', label: 'หน้าแรก' },
    { to: '/products', label: 'สินค้า' },
    { to: '/orders', label: 'คำสั่งซื้อ' },
];

export default function Navbar() {
    const { user, isAdmin, logout } = useAuth();
    const { totalItems } = useCart();
    const { dark, toggle } = useTheme();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Brand */}
                <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl text-emerald-700 dark:text-emerald-400">
                    <span className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg">🌱</span>
                    Smart Farm
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map((l) => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${location.pathname === l.to
                                    ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-semibold'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            {l.label}
                        </Link>
                    ))}

                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${location.pathname.startsWith('/admin')
                                    ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-semibold'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                                }`}
                        >
                            แอดมิน
                        </Link>
                    )}

                    {/* Cart */}
                    <Link
                        to="/cart"
                        className="relative px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all"
                    >
                        🛒 ตะกร้า
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                                {totalItems}
                            </span>
                        )}
                    </Link>

                    {/* Dark mode */}
                    <button
                        onClick={toggle}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                        title="Toggle dark mode"
                    >
                        {dark ? '☀️' : '🌙'}
                    </button>

                    {/* Auth */}
                    {user ? (
                        <div className="flex items-center gap-2 ml-2">
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                👋 {user.displayName || 'User'}
                            </span>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 ml-2">
                            <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-700 transition-all">
                                เข้าสู่ระบบ
                            </Link>
                            <Link to="/register" className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20">
                                สมัครสมาชิก
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile hamburger */}
                <div className="flex items-center gap-2 md:hidden">
                    <Link to="/cart" className="relative p-2">
                        <span className="text-xl">🛒</span>
                        {totalItems > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {totalItems}
                            </span>
                        )}
                    </Link>
                    <button onClick={toggle} className="p-2 text-gray-500">{dark ? '☀️' : '🌙'}</button>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 flex flex-col justify-center items-center gap-1.5"
                    >
                        <span className={`block w-6 h-0.5 bg-gray-700 dark:bg-gray-300 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`block w-6 h-0.5 bg-gray-700 dark:bg-gray-300 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                        <span className={`block w-6 h-0.5 bg-gray-700 dark:bg-gray-300 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 animate-[slideDown_0.2s_ease-out]">
                    {NAV_LINKS.map((l) => (
                        <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                            className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-800">
                            {l.label}
                        </Link>
                    ))}
                    {isAdmin && (
                        <Link to="/admin" onClick={() => setMenuOpen(false)}
                            className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-800">
                            แอดมิน
                        </Link>
                    )}
                    <hr className="border-gray-200 dark:border-gray-800" />
                    {user ? (
                        <button onClick={() => { logout(); setMenuOpen(false); }}
                            className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600">
                            ออกจากระบบ
                        </button>
                    ) : (
                        <>
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300">เข้าสู่ระบบ</Link>
                            <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-center bg-emerald-600 text-white">สมัครสมาชิก</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
