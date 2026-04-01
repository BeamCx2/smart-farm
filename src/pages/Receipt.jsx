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
            } catch (error) { console.error("Fetch Error:", error); }
            finally { setLoading(false); }
        };
        fetchOrder();
    }, [orderId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-[10px] uppercase tracking-[0.2em]">Loading Receipt...</div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center font-black text-[10px] uppercase tracking-[0.2em]">Order Not Found</div>;

    // 💰 [Logic การคำนวณยอดเงินสุทธิ]
    // 1. รวมราคาสินค้าทั้งหมด
    const itemsTotal = order.items?.reduce((acc, item) => acc + (item.price * item.qty), 0) || 0;

    // 🚚 2. เงื่อนไขค่าจัดส่ง: ไม่เกิน 1500 เสีย 100 | เกิน 1500 ส่งฟรี
    const shippingFee = itemsTotal > 1500 ? 0 : 100;

    // 💵 3. ยอดรวมสุทธิ (Net Total)
    const netTotal = itemsTotal + shippingFee;

    // 🧾 4. คำนวณภาษีมูลค่าเพิ่ม (VAT 7% แบบรวมใน)
    const vatAmount = netTotal * (7 / 107);
    const subTotalBeforeVat = netTotal - vatAmount;

    // 👤 ข้อมูลลูกค้า
    const customer = order.customer || {};
    const fullAddress = `${customer.address || ''} ${customer.subDistrict || ''} ${customer.district || ''} ${customer.province || ''} ${customer.zipcode || ''}`.trim();

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 sm:p-12 font-sans overflow-x-hidden text-gray-800">
            
            {/* 🛠 Toolbar (ซ่อนตอนปริ้น) */}
            <div className="max-w-md w-full flex justify-end gap-2 mb-4 no-print text-white">
                <button 
                    onClick={() => window.print()} 
                    className="p-3 bg-emerald-600 rounded-2xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2"
                >
                    <span className="text-xl">🖨️</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Print Receipt</span>
                </button>
                <button 
                    onClick={() => navigate('/')} 
                    className="p-3 bg-gray-900 rounded-2xl shadow-xl hover:bg-black transition-all"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
                </button>
            </div>

            {/* 📄 Receipt Paper */}
            <div id="receipt-print" className="max-w-md w-full bg-white shadow-2xl p-8 sm:p-12 border border-gray-50 flex flex-col items-center relative">
                
                {/* Logo & Header */}
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500/10">
                    <span className="text-3xl">🌿</span>
                </div>
                <h1 className="text-sm font-black tracking-tighter text-center uppercase leading-tight mb-1">
                    Smart Farm Greenhouse Co., Ltd.
                </h1>
                <p className="text-[10px] text-gray-400 font-bold mb-6 uppercase tracking-widest border-b pb-4 w-full text-center">
                    ใบกำกับภาษีอย่างย่อ / ใบเสร็จรับเงิน
                </p>

                {/* ข้อมูลการสั่งซื้อ */}
                <div className="w-full text-[11px] font-bold space-y-1.5 mb-6 uppercase">
                    <div className="flex justify-between border-b border-gray-50 pb-1">
                        <span className="opacity-40">Order Date:</span>
                        <span>{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('th-TH') : '01/04/2569'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-1">
                        <span className="opacity-40">Order ID:</span>
                        <span>#{order.orderId}</span>
                    </div>
                    
                    {/* ข้อมูลลูกค้า (Customer Info Box) */}
                    <div className="bg-gray-50 p-5 rounded-[2.5rem] border border-gray-100 mt-4 text-left">
                        <p className="text-[8px] text-emerald-600 mb-2 tracking-[0.2em] font-black uppercase border-b border-emerald-100 w-fit">Customer Info</p>
                        <p className="text-gray-900 text-[14px] mb-1 font-black leading-none">{customer.name || 'ลูกค้าทั่วไป'}</p>
                        <p className="text-gray-400 font-medium normal-case leading-relaxed text-[11px] mb-2 italic">
                            {fullAddress || "ไม่ระบุที่อยู่จัดส่ง"}
                        </p>
                        <p className="text-gray-900 text-[10px] font-black">TEL: {customer.phone || '0XX-XXX-XXXX'}</p>
                        <p className="text-gray-400 text-[9px] lowercase font-medium">{customer.email}</p>
                    </div>
                </div>

                {/* รายการสินค้า (Items) */}
                <div className="w-full mb-8">
                    <div className="border-b-2 border-black pb-2 mb-4 text-center">
                        <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em]">Description</p>
                    </div>
                    <div className="space-y-6">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex flex-col text-[13px] font-bold leading-tight uppercase">
                                <p className="mb-1 text-gray-900 font-black tracking-tight">{idx + 1}) {item.name}</p>
                                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
                                    <span>Qty: {item.qty} @ {formatTHB(item.price)}</span>
                                    <span className="text-black font-black text-[12px]">{formatTHB(item.price * item.qty)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* สรุปยอดเงิน (Financial Summary) */}
                <div className="w-full border-t-2 border-black pt-5 space-y-2 mb-10">
                    <div className="flex justify-between text-[11px] font-bold uppercase text-gray-400">
                        <span>ค่าสินค้า (Items Subtotal)</span>
                        <span className="text-black">{formatTHB(itemsTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold uppercase text-gray-400">
                        <span>ค่าจัดส่ง (Shipping Fee) {shippingFee === 0 && <span className="text-emerald-500 text-[9px] ml-1">(FREE)</span>}</span>
                        <span className={shippingFee === 0 ? "text-emerald-500" : "text-black"}>
                            {shippingFee === 0 ? '฿0.00' : formatTHB(shippingFee)}
                        </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold uppercase text-gray-300 pt-1 border-t border-gray-50">
                        <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                        <span className="text-black opacity-60">{formatTHB(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-black uppercase pt-4 mt-1 border-t border-gray-100">
                        <span className="text-gray-900 leading-none">Net Total Amount</span>
                        <span className="text-emerald-600 text-2xl leading-none font-black">{formatTHB(netTotal)}</span>
                    </div>
                </div>

                <p className="mt-6 text-[8px] font-black text-gray-200 uppercase tracking-[0.5em] text-center italic">
                    --- Thank you for your support ---
                </p>
            </div>

            {/* Print Settings CSS */}
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
                        max-width: 100%;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 20px !important;
                    }
                    @page { margin: 10mm; }
                }
            ` }} />
        </div>
    );
}
