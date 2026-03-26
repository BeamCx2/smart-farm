exports.handler = async (event) => {
    // 🛡️ เช็ค Method ต้องเป็น POST เท่านั้น
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const payload = body.payload;

        if (!payload) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: "QR Payload missing" })
            };
        }

        // 🚀 เรียกใช้ EasySlip API V1 (ใช้ fetch มาตรฐานที่มีใน Node.js v18+)
        const response = await fetch('https://developer.easyslip.com/api/v1/verify', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab', // Key บอส
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payload: payload })
        });

        const data = await response.json();

        // ✅ ส่งผลลัพธ์กลับไปให้หน้าบ้าน
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Function Error:", error.message);
        return {
            statusCode: 200, // ส่ง 200 เพื่อให้หน้าบ้านอ่าน Error ได้ (ไม่ขึ้นสีแดง 500)
            body: JSON.stringify({ success: false, message: "ระบบหลังบ้านขัดข้อง: " + error.message })
        };
    }
};
