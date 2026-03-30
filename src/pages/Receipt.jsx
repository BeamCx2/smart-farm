import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
                if (!snap.empty) {
                    setOrder(snap.docs[0].data());
                }
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase">Loading Receipt...</div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center font-black uppercase">Receipt Not Found</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans uppercase">
            <div className="max-w-md w-full bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-gray-100">
                {/* Header: Success Icon */}
                <div className="bg-emerald-600 p-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <span className="text-white text-3xl font-black">✓</span>
                    </div>
                    <h1 className="text-white font-black tracking-tighter text-2xl">Payment Successful</h1>
                    <p className="text-emerald-100 text-[10px] tracking-[0.2em] font-black mt-1">Smart Farm Official Receipt</p>
                </div>

                <div className="p-10">
                    {/* Order Details */}
                    <div className="flex justify-between items-end mb-8 pb-4 border-b border-dashed border-gray-100">
                        <div className="text-left">
                            <p className="text-[9px] text-gray-400 font-black tracking-widest mb-1">Receipt Number</p>
                            <p className="text-xs font-black text-gray-900 tracking-tighter">#{order.orderId}</p>
                        </div>
                        <div className="text-right text-[10px] font-black text-gray-900">
                            {order.updatedAt?.toDate().toLocaleDateString('th-TH')}
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4 mb-8">
                        {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                                <div className="text-left">
                                    <p className="text-xs font-black text-gray-800 tracking-tight">{item.name}</p>
                                    <p className="text-[9px] text-gray-400 font-black">QTY: {item.qty}</p>
                                </div>
                                <p className="text-xs font-black text-gray-900">{formatTHB(item.price * item.qty)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-50 rounded-[1.5rem] p-6 mb-8 text-left space-y-3">
                        <div>
                            <p className="text-[8px] text-gray-400 font-black tracking-[0.1em] mb-0.5">Transaction Reference</p>
                            <p className="text-[10px] font-black text-gray-600 break-all leading-none">{order.transRef || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-gray-400 font-black tracking-[0.1em] mb-0.5">Payment Method</p>
                            <p className="text-[10px] font-black text-gray-600 leading-none">PromptPay (Verified by AI)</p>
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="flex justify-between items-center mb-10">
                        <p className="text-lg font-black text-gray-900 tracking-tighter">Total Paid</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">{formatTHB(order.amount)}</p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4 font-black">
                        <button 
                            onClick={() => window.print()}
                            className="py-4 rounded-[1.2rem] bg-gray-100 text-gray-900 text-[10px] tracking-widest hover:bg-gray-200 transition-all active:scale-95 uppercase"
                        >
                            Print PDF
                        </button>
                        <button 
                            onClick={() => navigate('/')}
                            className="py-4 rounded-[1.2rem] bg-gray-900 text-white text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 uppercase"
                        >
                            Continue
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 text-center">
                    <p className="text-[8px] text-gray-300 font-black tracking-[0.3em]">Thank you for supporting Smart Farm</p>
                </div>
            </div>
        </div>
    );
}
