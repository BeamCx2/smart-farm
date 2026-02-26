import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3500) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-6 right-6 z-[999] flex flex-col-reverse gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        onClick={() => removeToast(t.id)}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium
              animate-[slideIn_0.35s_ease-out] cursor-pointer min-w-[280px]
              ${t.type === 'success' ? 'bg-emerald-600 text-white' : ''}
              ${t.type === 'error' ? 'bg-red-600 text-white' : ''}
              ${t.type === 'info' ? 'bg-blue-600 text-white' : ''}
              ${t.type === 'warning' ? 'bg-amber-500 text-white' : ''}
            `}
                    >
                        <span>
                            {t.type === 'success' && '✅'}
                            {t.type === 'error' && '❌'}
                            {t.type === 'info' && 'ℹ️'}
                            {t.type === 'warning' && '⚠️'}
                        </span>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
