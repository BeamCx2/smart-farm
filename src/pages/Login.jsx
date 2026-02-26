import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Login() {
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            addToast('เข้าสู่ระบบสำเร็จ!', 'success');
            navigate('/');
        } catch (err) {
            addToast(err.code === 'auth/invalid-credential' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[calc(100vh-4rem-80px)] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-10 shadow-xl border border-gray-100 dark:border-gray-800">
                <h2 className="text-2xl font-bold mb-2">ยินดีต้อนรับ 👋</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">เข้าสู่ระบบ Smart Farm</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5">อีเมล</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5">รหัสผ่าน</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="รหัสผ่าน" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50">
                        {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    ยังไม่มีบัญชี? <Link to="/register" className="text-emerald-600 font-semibold hover:underline">สมัครสมาชิก</Link>
                </p>
            </div>
        </div>
    );
}
