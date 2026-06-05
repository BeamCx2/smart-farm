import React from 'react';

/**
 * Professional Card Component
 * @param {React.ReactNode} children - card content
 * @param {string} className - additional classes
 */
const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * Card Header
 */
Card.Header = ({ children, className = '' }) => (
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

/**
 * Card Body
 */
Card.Body = ({ children, className = '' }) => (
    <div className={`px-6 py-4 ${className}`}>
        {children}
    </div>
);

/**
 * Card Footer
 */
Card.Footer = ({ children, className = '' }) => (
    <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 ${className}`}>
        {children}
    </div>
);

export default Card;
