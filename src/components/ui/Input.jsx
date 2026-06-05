import React from 'react';

/**
 * Professional Input Component
 * @param {string} type - input type
 * @param {string} placeholder - placeholder text
 * @param {string} value - input value
 * @param {function} onChange - change handler
 * @param {boolean} disabled - disabled state
 * @param {string} error - error message
 * @param {string} className - additional classes
 * @param {...any} props - other input props
 */
const Input = React.forwardRef(({
    type = 'text',
    placeholder = '',
    value,
    onChange,
    disabled = false,
    error,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            <input
                ref={ref}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500 dark:border-red-400' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-red-600 dark:text-red-400 text-sm mt-1 font-medium">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
