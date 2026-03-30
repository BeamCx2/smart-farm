exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { amount, orderId } = JSON.parse(event.body);

        // 🚀 เรียก EasySlip V1 (ตัวเดียวที่สร้าง QR ได้ตามคู่มือ)
        const response = await fetch('https://developer.easyslip.com/api/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: parseFloat(amount), orderId: orderId })
        });

        const result = await response.json();

        // ✅ บังคับโครงสร้างให้หน้าบ้านอ่านง่ายที่สุด
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
                raw: result.raw || result.rawPayload || (result.data ? result.data.raw : ""),
                success: result.status === 200
            })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
