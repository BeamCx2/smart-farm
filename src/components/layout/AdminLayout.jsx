import { Link, Outlet, useLocation } from 'react-router-dom';

const ADMIN_LINKS = [
    { to: '/admin', label: '📊 แดชบอร์ด', exact: true },
    { to: '/admin/products', label: '📦 จัดการสินค้า' },
    { to: '/admin/orders', label: '🛒 จัดการคำสั่งซื้อ' },
];

export default function AdminLayout() {
    const location = useLocation();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <aside className="lg:w-64 shrink-0">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 lg:sticky lg:top-24">
                        <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-4 px-3">⚙️ แอดมิน</h3>
                        <nav className="space-y-1">
                            {ADMIN_LINKS.map((l) => {
                                const active = l.exact
                                    ? location.pathname === l.to
                                    : location.pathname.startsWith(l.to);
                                return (
                                    <Link
                                        key={l.to}
                                        to={l.to}
                                        className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                                            ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {l.label}
                                    </Link>
                                );
                            })}
                        </nav>
                        <hr className="my-4 border-gray-200 dark:border-gray-800" />
                        <Link to="/" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                            ← กลับหน้าร้าน
                        </Link>
                    </div>
                </aside>
                {/* Content */}
                <div className="flex-1 min-w-0">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
