import React, { useState } from 'react';

const PageTabs = ({ tabs = [], onTabChange = () => { } }) => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabClick = (index) => {
        setActiveTab(index);
        onTabChange(index, tabs[index]);
    };

    const defaultTabs = [
        { label: 'หนึ่งแรก', id: 'first' },
        { label: 'วิธีเล่นสำเร็จ', id: 'success' },
        { label: 'กฎการเล่น', id: 'rules' },
        { label: 'ข้อมูล', id: 'info' },
        { label: 'Discord', id: 'discord' },
    ];

    const tabList = tabs.length > 0 ? tabs : defaultTabs;

    return (
        <div className="flex items-center justify-center gap-3 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 flex-wrap">
            {tabList.map((tab, index) => (
                <button
                    key={tab.id || index}
                    onClick={() => handleTabClick(index)}
                    className={`px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${activeTab === index
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default PageTabs;
