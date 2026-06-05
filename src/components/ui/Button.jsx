import React from 'react';

/**
 * Professional Button Component
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} disabled - button disabled state
 * @param {boolean} loading - show loading spinner
 * @param {string} className - additional classes
 * @param {React.ReactNode} children - button content
 * @param {...any} props - other button props
 */
const Button = React.forwardRef(({
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    children,
    ...props
}, ref) => {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const variantClasses = {
        primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-md hover:shadow-lg focus:ring-emerald-500',
        secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 shadow-sm focus:ring-gray-400',
        outline: 'border-2 border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-95',
        ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-md hover:shadow-lg focus:ring-red-500',
    };

    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
});

Button.displayName = 'Button';
export default Button;
