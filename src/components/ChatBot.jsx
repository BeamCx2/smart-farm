import { useState, useRef, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { VEGETABLE_KNOWLEDGE, findVegetable, generateVegetableResponse } from '../lib/vegetableKnowledge';

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "สวัสดีครับ! ผมเป็น AI ผู้ช่วยเรื่องผักอินทรีย์ มีอะไรให้ช่วยเหลือไหมครับ?\n\n💡 ลองถามเกี่ยวกับ:\n• โภชนาการของผัก\n• ประโยชน์ต่อสุขภาพ\n• วิธีการปรุงอาหาร\n• วิธีเก็บรักษา",
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const { addToast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ฐานข้อมูลความรู้เกี่ยวกับผัก (จะขยายได้)
    const vegetableKnowledge = {
        'ผักกาด': {
            nutrition: 'วิตามิน A, C, K, แคลเซียม, ไฟเบอร์สูง',
            benefits: 'ช่วยบำรุงสายตา, กระดูกแข็งแรง, ป้องกันมะเร็ง',
            cooking: 'กินสด, แกง, ยำ, ต้ม'
        },
        'ผักบุ้ง': {
            nutrition: 'วิตามิน A, C, ธาตุเหล็ก, แมกนีเซียม',
            benefits: 'ช่วยขับปัสสาวะ, ลดความดันโลหิต, บำรุงผิว',
            cooking: 'ผัด, แกง, ต้ม'
        },
        'คะน้า': {
            nutrition: 'วิตามิน A, C, K, แคลเซียม, ธาตุเหล็ก',
            benefits: 'บำรุงกระดูก, ป้องกันโรคโลหิตจาง, ดีต่อสายตา',
            cooking: 'กินสด, แกง, ยำ, ต้ม'
        },
        'ผักชี': {
            nutrition: 'วิตามิน A, C, K, ธาตุเหล็ก, แมกนีเซียม',
            benefits: 'ช่วยย่อยอาหาร, ลดคอเลสเตอรอล, ป้องกันมะเร็ง',
            cooking: 'โรยหน้า, แกง, ยำ'
        },
        'ขึ้นฉ่าย': {
            nutrition: 'วิตามิน A, C, K, แคลเซียม, ธาตุเหล็ก',
            benefits: 'บำรุงกระดูก, ป้องกันโรคโลหิตจาง, ดีต่อผิว',
            cooking: 'กินสด, แกง, ยำ, ต้ม'
        }
    };

    const generateResponse = async (userMessage) => {
        const message = userMessage.toLowerCase().trim();

        // คำสั่งพิเศษ
        if (message === 'เมนู' || message === 'menu' || message === 'ตัวเลือก') {
            return '📋 เมนูคำถามที่ถามได้:\n\n🌱 เกี่ยวกับผัก:\n• "ผักกาดโภชนาการ"\n• "คะน้าดีต่ออะไร"\n• "ผักบุ้งทำยังไง"\n\n📊 ข้อมูลโภชนาการ:\n• "วิตามินในผักชี"\n• "แคลเซียมสูง"\n\n👨‍🍳 วิธีปรุงอาหาร:\n• "แกงผักกาด"\n• "ยำคะน้า"\n\n🚚 บริการ:\n• "จัดส่ง"\n• "ชำระเงิน"\n• "ราคาผัก"\n\n💬 พิมพ์ชื่อผัก + คำถาม เช่น "ผักกาด ประโยชน์"';
        }

        // ใช้ฐานข้อมูลใหม่ก่อน
        const foundVegetable = findVegetable(message);
        if (foundVegetable) {
            return generateVegetableResponse(message, foundVegetable);
        }

        // fallback ไปใช้ฐานข้อมูลเก่า
        const oldFoundVegetable = Object.keys(vegetableKnowledge).find(veg =>
            message.includes(veg.toLowerCase())
        );

        if (oldFoundVegetable) {
            const info = vegetableKnowledge[oldFoundVegetable];

            if (message.includes('โภชนาการ') || message.includes('วิตามิน')) {
                return `${oldFoundVegetable} มีคุณค่าทางโภชนาการสูง: ${info.nutrition}`;
            }

            if (message.includes('ประโยชน์') || message.includes('ดีต่อ')) {
                return `ประโยชน์ของ${oldFoundVegetable}: ${info.benefits}`;
            }

            if (message.includes('ปรุง') || message.includes('ทำ') || message.includes('วิธี')) {
                return `วิธีปรุง${oldFoundVegetable}: ${info.cooking}`;
            }

            // ข้อมูลทั่วไป
            return `${oldFoundVegetable} เป็นผักอินทรีย์คุณภาพสูงจาก Smart Farm 🌱\n\nโภชนาการ: ${info.nutrition}\nประโยชน์: ${info.benefits}\nวิธีปรุง: ${info.cooking}`;
        }

        // คำถามทั่วไปเกี่ยวกับบริการ
        if (message.includes('ปลูก') || message.includes('เพาะ') || message.includes('อินทรีย์')) {
            return 'ผักอินทรีย์ของเราใช้ระบบปลูกแบบ hydroponic และ organic farming ไม่ใช้สารเคมีใดๆ ปลูกในสภาพแวดล้อมที่ควบคุมอย่างดี 🌱';
        }

        if (message.includes('ส่ง') || message.includes('จัดส่ง') || message.includes('ขนส่ง')) {
            return 'เราจัดส่งสินค้าทุกวัน ตั้งแต่ 08:00-18:00 น. ส่งถึงบ้านภายใน 1-2 วันทำการ 🚚\n\n• ส่งฟรีสำหรับคำสั่งซื้อ 500฿ ขึ้นไป\n• ส่งด่วนภายใน 24 ชั่วโมง (มีค่าบริการเพิ่ม)';
        }

        if (message.includes('ราคา') || message.includes('แพง') || message.includes('ถูก')) {
            return 'ราคาผักของเราเป็นราคายุติธรรม เพราะเราใส่ใจในทุกขั้นตอนการผลิต ไม่ใช้สารเคมี และมีคุณภาพสูง 💰\n\n• ผักสดใหม่ทุกวัน\n• ไม่มีสารตกค้าง\n• ปลูกด้วยใจ';
        }

        if (message.includes('สด') || message.includes('คุณภาพ') || message.includes('เกรด')) {
            return 'ผักของเราเก็บเกี่ยวสดใหม่ทุกวัน ผ่านการคัดสรรอย่างพิถีพิถันก่อนส่งถึงมือคุณ ✨\n\n• เก็บเกี่ยววันเดียวกัน\n• คัดเกรด A\n• บรรจุอย่างปลอดภัย';
        }

        if (message.includes('สั่ง') || message.includes('ซื้อ') || message.includes('ออเดอร์')) {
            return 'สั่งซื้อได้ง่ายๆ เพียง 3 ขั้นตอน:\n\n1️⃣ เลือกผักที่ต้องการ\n2️⃣ เพิ่มลงตะกร้า\n3️⃣ ชำระเงินและรอรับที่บ้าน 🛒\n\nสนใจผักอะไรเป็นพิเศษครับ?';
        }

        if (message.includes('ชำระ') || message.includes('จ่าย') || message.includes('เงิน')) {
            return 'ช่องทางการชำระเงิน:\n\n💳 บัตรเครดิต/เดบิต\n🏦 โอนผ่านธนาคาร\n📱 พร้อมเพย์/ทรูมันนี่\n💵 เก็บเงินปลายทาง\n\nปลอดภัย 100% 🔒';
        }

        // ถามคำถามทั่วไป
        if (message.includes('สวัสดี') || message.includes('หวัดดี') || message.includes('ดีครับ')) {
            return 'สวัสดีครับ! ยินดีให้บริการครับ มีอะไรให้ช่วยเหลือเรื่องผักอินทรีย์ไหมครับ? 🌱';
        }

        if (message.includes('ขอบคุณ') || message.includes('ขอบใจ') || message.includes('ขอบคุณมาก')) {
            return 'ยินดีครับ! หากมีคำถามอะไรเพิ่มเติม สามารถถามได้เลยนะครับ 😊';
        }

        if (message.includes('ลาก่อน') || message.includes('บาย') || message.includes('ปิด')) {
            return 'ลาก่อนครับ! ขอบคุณที่สนใจผักอินทรีย์ของเรา สวัสดีครับ 👋';
        }

        // ถามเกี่ยวกับ AI หรือระบบ
        if (message.includes('ai') || message.includes('บอท') || message.includes('ผู้ช่วย')) {
            return 'ผมเป็น AI ผู้ช่วยของ Smart Farm ครับ สามารถตอบคำถามเกี่ยวกับผักอินทรีย์, โภชนาการ, และคำแนะนำการใช้งานได้เลย 🤖';
        }

        // คำตอบ default สำหรับคำถามที่ไม่รู้จัก
        return 'ผมยังเรียนรู้เรื่องผักอยู่ครับ แต่สามารถช่วยเรื่องเหล่านี้ได้:\n\n🌱 เกี่ยวกับผัก: ผักกาด, คะน้า, ผักบุ้ง, ผักชี, แคร์รอต, มะเขือเทศ\n📊 โภชนาการ: วิตามิน, แร่ธาตุ, ประโยชน์ต่อสุขภาพ\n👨‍🍳 วิธีปรุง: แกง, ยำ, ผัด, ต้ม\n🚚 การสั่งซื้อ: ราคา, การจัดส่ง, ชำระเงิน\n\nลองถามคำถามใหม่ดูไหมครับ? หรือพิมพ์ "เมนู" เพื่อดูตัวเลือกทั้งหมด';
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        try {
            // จำลองการ delay เล็กน้อย
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

            const botResponse = await generateResponse(inputMessage);
            const botMessage = {
                id: Date.now() + 1,
                text: botResponse,
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            addToast('เกิดข้อผิดพลาดในการส่งข้อความ', 'error');
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl transition-all duration-300 z-50 ${isOpen
                        ? 'bg-red-500 hover:bg-red-600 scale-110'
                        : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-110'
                    }`}
            >
                {isOpen ? (
                    <span className="text-white text-2xl">✕</span>
                ) : (
                    <span className="text-white text-xl">💬</span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-80 h-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-40 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-emerald-500 text-white p-4 rounded-t-2xl">
                        <h3 className="font-black text-sm uppercase tracking-widest">AI ผู้ช่วยเรื่องผัก</h3>
                        <p className="text-xs opacity-90">ถามอะไรก็ได้เกี่ยวกับผักอินทรีย์</p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                        }`}
                                >
                                    <p className="whitespace-pre-line">{msg.text}</p>
                                    <p className="text-xs opacity-60 mt-1">
                                        {msg.timestamp.toLocaleTimeString('th-TH', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="ถามอะไรเกี่ยวกับผัก..."
                                className="flex-1 px-4 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-500"
                                disabled={isTyping}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isTyping}
                                className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <span className="text-sm font-bold">📤 ส่ง</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}