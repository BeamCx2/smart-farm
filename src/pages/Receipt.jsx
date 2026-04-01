import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatTHB } from '../lib/utils';

export default function Receipt() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-[10px] uppercase">Loading Receipt...</div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center font-black text-[10px] uppercase">Order Not Found</div>;

    // 💰 การคำนวณภาษี (VAT 7%)
    const totalAmount = order.amount || 0;
    const vatAmount = totalAmount * (7 / 107); // คำนวณ VAT แบบรวมใน (Include VAT)
    const subTotal = totalAmount - vatAmount;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 sm:p-12 font-sans overflow-x-hidden">
            
            {/* 🛠 Toolbar (ซ่อนตอนพิมพ์) */}
            <div className="max-w-md w-full flex justify-end gap-2 mb-4 no-print">
                <button 
                    onClick={() => window.print()} 
                    className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xl hover:bg-emerald-700 transition-all active:scale-90 flex items-center gap-2"
                >
                    <span className="text-xl">🖨️</span>
                    <span className="text-[10px] font-black uppercase">Print Receipt</span>
                </button>
                <button 
                    onClick={() => navigate('/')} 
                    className="p-3 bg-gray-800 text-white rounded-2xl shadow-xl hover:bg-black transition-all"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Home</span>
                </button>
            </div>

            {/* 📄 ส่วนใบเสร็จ (Print Area) */}
            <div id="receipt-print" className="max-w-md w-full bg-white shadow-2xl p-8 sm:p-10 border border-gray-100 flex flex-col items-center relative">
                
                {/* 🌿 Header & Company Info */}
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500/10">
                    <span className="text-3xl">🌿</span>
                </div>
                <h1 className="text-sm font-black tracking-tighter text-center uppercase leading-tight mb-1 text-gray-900">
                    Smart Farm Greenhouse Co., Ltd.
                </h1>
                <p className="text-[9px] text-gray-400 font-bold mb-6 uppercase tracking-widest border-b pb-4 w-full text-center">
                    ใบกำกับภาษีอย่างย่อ / ใบเสร็จรับเงิน
                </p>

                {/* 📝 Order & Customer Details */}
                <div className="w-full text-[11px] font-bold space-y-3 mb-8 uppercase text-gray-700">
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="opacity-50">Order Date:</span>
                        <span className="text-black">{new Date(order.updatedAt?.seconds * 1000).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="opacity-50">Order ID:</span>
                        <span className="text-black">#{order.orderId}</span>
                    </div>
                    
                    {/* 👤 ข้อมูลลูกค้า (ดึงมาจาก Firebase) */}
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                        <p className="text-[9px] text-emerald-600 mb-2 tracking-[0.2em] font-black underline underline-offset-4">Customer Info</p>
                        <p className="text-black mb-1">{order.customerName || 'ทั่วไป'}</p>
                        <p className="text-gray-500 font-medium normal-case leading-relaxed mb-1 italic">
                            {order.address || 'เลขที่ 123 มหาวิทยาลัยหอการค้าไทย ดินแดง กรุงเทพฯ'}
                        </p>
                        <p className="text-black tracking-widest">TEL: {order.phone || '0XX-XXX-XXXX'}</p>
                    </div>
                </div>

                {/* 🛒 Items Table */}
                <div className="w-full mb-8">
                    <div className="border-b-2 border-black pb-2 mb-4">
                        <p className="text-[10px] font-black uppercase text-gray-400">Description</p>
                    </div>
                    <div className="space-y-6">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex flex-col text-[12px] font-bold leading-tight uppercase">
                                <p className="mb-1 text-gray-900 font-black tracking-tight">{idx + 1}) {item.name}</p>
                                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                                    <span>Qty: {item.qty} @ {formatTHB(item.price)}</span>
                                    <span className="text-black font-black">{formatTHB(item.price * item.qty)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 💰 Summary & Tax Section */}
                <div className="w-full border-t-2 border-black pt-4 space-y-2 mb-8">
                    <div className="flex justify-between text-[11px] font-bold uppercase">
                        <span className="text-gray-400">ยอดรวมก่อนภาษี (Subtotal)</span>
                        <span>{formatTHB(subTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold uppercase">
                        <span className="text-gray-400">ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                        <span>{formatTHB(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-black uppercase border-t pt-3 mt-2 border-gray-100">
                        <span className="text-gray-900 leading-none">Net Total Amount</span>
                        <span className="text-emerald-600 leading-none">{formatTHB(totalAmount)}</span>
                    </div>
                </div>

                <p className="mt-8 text-[8px] font-black text-gray-200 uppercase tracking-[0.5em] text-center italic">
                    --- Thank you for your support ---
                </p>
            </div>

            {/* 🛠 Print CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden; background: white !important; }
                    .no-print { display: none !important; }
                    #receipt-print, #receipt-print * { visibility: visible; }
                    #receipt-print {
                        position: absolute;
                        left: 50%;
                        transform: translateX(-50%);
                        top: 0;
                        width: 100%;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    @page { margin: 10mm; }
                }
            ` }} />
        </div>
    );
}
