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
        <nav className="sticky top-0 z-50 glass border-b border-white/20 dark:border-gray-700/50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Brand */}
                <Link to="/" className="flex items-center gap-3 font-black text-xl text-emerald-700 dark:text-emerald-400 hover:scale-105 transition-transform">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-lg shadow-lg animate-float">
                        🌱
                    </div>
                    <span className="gradient-text">Smart Farm</span>
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-2">
                    {NAV_LINKS.map((l) => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={`relative px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 group ${
                                location.pathname === l.to
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-lg'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            <span className="relative z-10">{l.label}</span>
                            {location.pathname === l.to && (
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-emerald-600/20 rounded-2xl animate-pulse"></div>
                            )}
                        </Link>
                    ))}

                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`relative px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 group ${
                                location.pathname.startsWith('/admin')
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-lg'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            <span className="relative z-10">👑 แอดมิน</span>
                        </Link>
                    )}

                    {/* Cart */}
                    <Link
                        to="/cart"
                        className="relative px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all hover:bg-white/50 dark:hover:bg-gray-800/50 group"
                    >
                        <span className="flex items-center gap-2">
                            🛒 ตะกร้า
                            {totalItems > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center animate-bounce shadow-lg">
                                    {totalItems}
                                </span>
                            )}
                        </span>
                    </Link>

                    {/* Dark mode */}
                    <button
                        onClick={toggle}
                        className="p-2.5 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all hover:scale-110"
                        title="Toggle dark mode"
                    >
                        <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
                    </button>

                    {/* Auth */}
                    {user ? (
                        <div className="flex items-center gap-3 ml-2">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/50 dark:bg-gray-800/50">
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                    👋 {user.displayName || 'User'}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all hover:scale-105"
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 ml-2">
                            <Link
                                to="/login"
                                className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-2xl transition-all hover:bg-white/50 dark:hover:bg-gray-800/50"
                            >
                                เข้าสู่ระบบ
                            </Link>
                            <Link
                                to="/register"
                                className="btn-primary px-6 py-2.5 text-sm font-bold text-white rounded-2xl shadow-lg transition-all hover:-translate-y-0.5"
                            >
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
