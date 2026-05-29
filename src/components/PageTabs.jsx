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
        <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-lg shadow-md">
            {tabList.map((tab, index) => (
                <button
                    key={tab.id || index}
                    onClick={() => handleTabClick(index)}
                    className={`px-6 py-2 rounded-lg font-black text-sm uppercase tracking-wide transition-all duration-300 whitespace-nowrap ${activeTab === index
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shadow-sm'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default PageTabs;
