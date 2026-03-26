const axios = require('axios');

exports.handler = async (event) => {
    // 🛡️ ป้องกันการเรียกใช้ที่ไม่ใช่ POST
    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: "Method Not Allowed" }) 
        };
    }

    try {
        const { payload } = JSON.parse(event.body);

        if (!payload) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ success: false, error: "ไม่พบข้อมูล QR Payload" }) 
            };
        }

        // 🚀 เรียกใช้ EasySlip API (Endpoint V2 ที่เสถียรที่สุด)
        // หมายเหตุ: บอสใช้ Key '929951ef-e7be-4b29-b441-7927e448d8ab' ตามที่ตั้งไว้
        const response = await axios.post('https://developer.easyslip.com/api/v1/verify', 
            { 
                payload: payload 
            }, 
            {
                headers: { 
                    'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab',
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // ⏳ กันระบบค้างถ้า API ตอบช้า
            }
        );

        // ✅ ตรวจสอบผลลัพธ์จาก EasySlip
        // 📍 EasySlip จะตอบกลับมาเป็น { status: 200, data: { ... } } ถ้าสำเร็จ
        const isSuccess = response.data.status === 200;

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // 🔓 กันปัญหา CORS เวลาเทส
            },
            body: JSON.stringify({
                success: isSuccess,
                data: response.data.data, // 📦 ส่งข้อมูลสลิปกลับไป (ยอดเงิน, ชื่อผู้รับ)
                error: isSuccess ? null : (response.data.message || "สลิปไม่ถูกต้อง")
            })
        };

    } catch (error) {
        console.error("Verify Error:", error.message);
        
        const status = error.response ? error.response.status : 500;
        const errorData = error.response ? error.response.data : { message: error.message };
        
        return {
            statusCode: status,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                error: "ระบบตรวจสอบสลิปขัดข้อง",
                details: errorData
            })
        };
    }
};
