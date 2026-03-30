import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-gray-400 animate-pulse">Loading Receipt...</div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-red-500">Receipt Not Found</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans uppercase">
            <div className="max-w-md w-full bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-500">
                
                {/* Header Section */}
                <div className="bg-emerald-600 p-8 text-center relative overflow-hidden">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <span className="text-white text-3xl font-black">✓</span>
                    </div>
                    <h1 className="text-white font-black tracking-tighter text-2xl leading-none">Payment Success</h1>
                    <p className="text-emerald-100 text-[10px] tracking-[0.2em] font-black mt-2">Smart Farm Official Receipt</p>
                </div>

                <div className="p-10">
                    {/* Order Header Info */}
                    <div className="flex justify-between items-end mb-8 pb-4 border-b border-dashed border-gray-100">
                        <div className="text-left">
                            <p className="text-[9px] text-gray-400 font-black tracking-widest mb-1">Order ID</p>
                            <p className="text-xs font-black text-gray-900 tracking-tighter">#{order.orderId}</p>
                        </div>
                        <div className="text-right text-[10px] font-black text-gray-900">
                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('th-TH') : '30/3/2569'}
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4 mb-6">
                        {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                                <div className="text-left">
                                    <p className="text-xs font-black text-gray-800 tracking-tight leading-tight">{item.name}</p>
                                    <p className="text-[9px] text-gray-400 font-black tracking-widest mt-0.5">QTY: {item.qty} x {formatTHB(item.price)}</p>
                                </div>
                                <p className="text-xs font-black text-gray-900">{formatTHB(item.price * item.qty)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Calculation Details */}
                    <div className="space-y-2 pt-4 border-t border-gray-50 mb-6">
                        <div className="flex justify-between text-[10px] font-black text-gray-400 tracking-widest">
                            <span>Subtotal</span>
                            <span>{formatTHB(order.subtotal || 0)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-gray-400 tracking-widest">
                            <span>Shipping</span>
                            <span>{formatTHB(order.shipping || 0)}</span>
                        </div>
                    </div>

                    {/* Total Amount ✨ ดึงจากฟิลด์ order.total */}
                    <div className="flex justify-between items-center mb-8">
                        <p className="text-lg font-black text-gray-900 tracking-tighter uppercase">Total Paid</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">
                            {formatTHB(order.total || 0)}
                        </p>
                    </div>

                    {/* Transaction Data Box */}
                    <div className="bg-gray-50 rounded-[1.5rem] p-5 mb-8 text-left space-y-3 border border-gray-100 shadow-inner">
                        <div>
                            <p className="text-[8px] text-gray-400 font-black tracking-[0.1em] mb-1">Transaction Ref</p>
                            <p className="text-[10px] font-black text-gray-600 break-all leading-snug">{order.transRef || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-gray-400 font-black tracking-[0.1em] mb-1">Customer Name</p>
                            <p className="text-[10px] font-black text-gray-600 leading-none">{order.customer?.name || "Customer"}</p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-4 font-black">
                        <button onClick={() => window.print()} className="py-4 rounded-[1.2rem] bg-gray-50 text-gray-900 text-[10px] tracking-widest border border-gray-100 hover:bg-gray-100 transition-all active:scale-95">
                            Print PDF
                        </button>
                        <button onClick={() => navigate('/')} className="py-4 rounded-[1.2rem] bg-gray-900 text-white text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                            Continue
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50/50 p-6 text-center border-t border-gray-50">
                    <p className="text-[8px] text-gray-300 font-black tracking-[0.4em] uppercase">Smart Farm Gateway System</p>
                </div>
            </div>
        </div>
    );
}
