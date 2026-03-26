const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { payload } = JSON.parse(event.body);

        if (!payload) {
            return { statusCode: 400, body: JSON.stringify({ success: false, error: "ไม่พบ QR Payload" }) };
        }

        // 🚀 เรียกใช้ EasySlip API V1 (แม่นยำที่สุดสำหรับพร้อมเพย์)
        const response = await axios.post('https://developer.easyslip.com/api/v1/verify', 
            { 
                payload: payload 
            }, 
            {
                headers: { 
                    'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab', // Key บอส
                    'Content-Type': 'application/json'
                },
                timeout: 10000 
            }
        );

        // ✅ ส่ง JSON ทั้งหมดกลับไป (ที่มีโครงสร้าง event: "FOUND" และ data: { rawSlip: { ... } })
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify(response.data) 
        };

    } catch (error) {
        console.error("V1 Verify Error:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: "ระบบตรวจสอบสลิปขัดข้อง", details: error.message })
        };
    }
};
