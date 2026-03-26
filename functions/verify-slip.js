// 📍 ไฟล์: netlify/functions/verify-slip.js
const axios = require('axios');

exports.handler = async (event) => {
    // 🛡️ เช็คเบื้องต้น
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const payload = body.payload;

        if (!payload) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: "Payload missing" })
            };
        }

        // 🚀 เรียก API ด้วยความระมัดระวัง
        const response = await axios.post('https://developer.easyslip.com/api/v1/verify', 
            { payload: payload },
            {
                headers: { 
                    'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab',
                    'Content-Type': 'application/json'
                },
                timeout: 8000 // ถ้าธนาคารช้าเกิน 8 วิ ให้ตัดก่อน
            }
        );

        // ✅ ส่งผลลัพธ์กลับแบบปลอดภัย
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response.data)
        };

    } catch (error) {
        // 🚩 จุดแก้ 500: ดักจับ Error ไม่ให้ Function บึ้ม
        console.error("Function Error:", error.message);
        
        return {
            statusCode: 200, // ส่ง 200 กลับไปแต่บอกว่า success: false เพื่อไม่ให้หน้าบ้านขึ้น 500
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                message: "ระบบหลังบ้านขัดข้อง: " + (error.response?.data?.message || error.message)
            })
        };
    }
};
