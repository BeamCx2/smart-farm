exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { amount, orderId } = JSON.parse(event.body);

        // 🚀 📍 สร้าง QR ต้องใช้ v1 ตามรูปที่บอสส่งมาครับ
        const response = await fetch('https://developer.easyslip.com/api/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                orderId: orderId,
            })
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(data) 
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
