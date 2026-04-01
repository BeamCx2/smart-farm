import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatTHB } from '../lib/utils';
import { QRCodeCanvas } from 'qrcode.react';

export default function Receipt() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✨ State สำหรับตัวเลือกการพิมพ์
    const [showOptions, setShowOptions] = useState(false);
    const [printOptions, setPrintOptions] = useState({
        hideDate: false,
        blackText: false
    });

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
                const snap = await getDocs(q);
                if (!snap.empty) setOrder(snap.docs[0].data());
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchOrder();
    }, [orderId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-[10px]">Loading...</div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-[10px]">Not Found</div>;

    return (
        <div className={`min-h-screen bg-gray-100 flex flex-col items-center p-6 sm:p-12 font-sans transition-colors duration-300 ${printOptions.blackText ? 'text-black' : 'text-gray-800'}`}>
            
            {/* 🛠 Toolbar & Settings Button (ไม่แสดงตอนพิมพ์) */}
            <div className="max-w-md w-full flex justify-end gap-2 mb-4 no-print">
                <button 
                    onClick={() => setShowOptions(true)} 
                    className="p-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-all active:scale-90"
                >
                    <span className="text-xl leading-none">⚙️</span>
                </button>
                <button onClick={() => window.print()} className="p-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all">
                    <span className="text-xl leading-none">🖨️</span>
                </button>
            </div>

            {/* 📄 Receipt Content */}
            <div className={`max-w-md w-full bg-white shadow-2xl p-8 sm:p-10 border border-gray-100 flex flex-col items-center relative ${printOptions.blackText ? 'print-black' : ''}`}>
                
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500/10">
                    <span className="text-3xl">🌿</span>
                </div>
                
                <h1 className="text-sm font-black tracking-tighter text-center uppercase leading-tight mb-1">
                    Smart Farm Greenhouse Co., Ltd.
                </h1>
                <p className="text-[10px] text-gray-400 font-bold mb-6 uppercase tracking-widest border-b pb-4 w-full text-center">
                    ใบกำกับภาษีอย่างย่อ / ใบเสร็จรับเงิน
                </p>

                {/* Info Section */}
                <div className="w-full text-[11px] font-bold space-y-1 mb-6 uppercase">
                    {!printOptions.hideDate && (
                        <div className="flex justify-between">
                            <span className="opacity-50">Date:</span>
                            <span>{new Date(order.updatedAt?.seconds * 1000).toLocaleDateString('th-TH')}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="opacity-50">Order ID:</span>
                        <span>#{order.orderId}</span>
                    </div>
                </div>

                {/* Items Table */}
                <div className="w-full mb-8">
                    <div className="border-b-2 border-black pb-2 mb-2">
                        <p className="text-[10px] font-black uppercase text-gray-400">Description</p>
                    </div>
                    <div className="space-y-4">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex flex-col text-[12px] font-bold leading-tight uppercase">
                                <p className="mb-1">{idx + 1}) {item.name}</p>
                                <div className="flex justify-between items-center text-[11px] opacity-60">
                                    <span>Qty: {item.qty} @ {formatTHB(item.price)}</span>
                                    <span className="opacity-100 text-gray-900">{formatTHB(item.price * item.qty)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="w-full border-t-2 border-black pt-4 space-y-1 mb-8">
                    <div className="flex justify-between text-base font-black uppercase">
                        <span>Total Amount</span>
                        <span className="text-emerald-600">{formatTHB(order.amount)}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center bg-gray-50 p-6 rounded-[2rem] w-full border border-gray-100">
                    <QRCodeCanvas value={`https://smartfarmtest.netlify.app/receipt/${orderId}`} size={100} />
                </div>
            </div>

            {/* ⚙️ Print Options Modal (Settings) */}
            {showOptions && (
                <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-[2rem] w-full max-w-xs p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <h2 className="text-sm font-black uppercase mb-6 border-b pb-2 tracking-tighter">ตัวเลือกการพิมพ์</h2>
                        
                        <div className="space-y-6">
                            {/* Toggle ซ่อนวันที่ */}
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold uppercase">ซ่อนทุกวันที่</span>
                                <button 
                                    onClick={() => setPrintOptions(prev => ({...prev, hideDate: !prev.hideDate}))}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${printOptions.hideDate ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${printOptions.hideDate ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Toggle ตัวอักษรสีดำ */}
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold uppercase">ตัวอักษรสีดำ</span>
                                <button 
                                    onClick={() => setPrintOptions(prev => ({...prev, blackText: !prev.blackText}))}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${printOptions.blackText ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${printOptions.blackText ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowOptions(false)}
                            className="w-full mt-10 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl active:scale-95 transition-all"
                        >
                            ตกลง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
