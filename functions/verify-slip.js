const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { payload } = JSON.parse(event.body);
        console.log("DEBUG: Received Payload from Frontend:", payload); // 📍 ดูว่าหน้าบ้านส่งอะไรมา

        const response = await axios.post('https://developer.easyslip.com/api/v1/verify', 
            { payload: payload }, 
            {
                headers: { 
                    'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab',
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("DEBUG: EasySlip Response:", response.data); // 📍 ดูว่า EasySlip ตอบอะไรมา

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: response.data.status === 200,
                data: response.data.data,
                error: response.data.message
            })
        };
    } catch (error) {
        // 📍 ถ้าพังตรงนี้ บอสจะเห็นใน Logs เลยว่าพังเพราะอะไร
        console.error("CRITICAL ERROR:", error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: "ระบบตรวจสอบสลิปขัดข้อง", details: error.message })
        };
    }
};
