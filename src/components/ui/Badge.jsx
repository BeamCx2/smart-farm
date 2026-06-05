import React from 'react';

/**
 * Professional Badge Component
 * @param {string} variant - 'success' | 'error' | 'warning' | 'info' | 'neutral'
 * @param {string} size - 'sm' | 'md'
 * @param {React.ReactNode} children - badge content
 * @param {string} className - additional classes
 */
const Badge = ({ variant = 'neutral', size = 'md', children, className = '' }) => {
    const baseClasses = 'font-semibold rounded-full inline-flex items-center gap-1.5';

    const sizeClasses = {
        sm: 'px-3 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
    };

    const variantClasses = {
        success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        error: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
        warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    };

    return (
        <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
