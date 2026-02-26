import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Register() {
    const { register } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', password2: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password2) {
            addToast('รหัสผ่านไม่ตรงกัน', 'error');
            return;
        }
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            addToast('สมัครสมาชิกสำเร็จ!', 'success');
            navigate('/');
        } catch (err) {
            addToast(err.code === 'auth/email-already-in-use' ? 'อีเมลนี้ถูกใช้แล้ว' : 'เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[calc(100vh-4rem-80px)] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-10 shadow-xl border border-gray-100 dark:border-gray-800">
                <h2 className="text-2xl font-bold mb-2">สร้างบัญชี 🌱</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">สมัครสมาชิก Smart Farm</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5">ชื่อ-นามสกุล</label>
                        <input name="name" value={form.name} onChange={handleChange} required
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="สมชาย ใจดี" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5">อีเมล</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5">รหัสผ่าน</label>
                        <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="อย่างน้อย 6 ตัวอักษร" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5">ยืนยันรหัสผ่าน</label>
                        <input name="password2" type="password" value={form.password2} onChange={handleChange} required
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 outline-none transition-all text-sm" placeholder="ยืนยันรหัสผ่าน" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50">
                        {loading ? 'กำลังดำเนินการ...' : 'สมัครสมาชิก'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    มีบัญชีแล้ว? <Link to="/login" className="text-emerald-600 font-semibold hover:underline">เข้าสู่ระบบ</Link>
                </p>
            </div>
        </div>
    );
}
