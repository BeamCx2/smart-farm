exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { payload } = JSON.parse(event.body); // รับค่าข้อความ QR จากหน้าบ้าน

        // 🚀 เรียก EasySlip V2 API ตาม curl ที่บอสส่งมา
        const response = await fetch('https://api.easyslip.com/v2/verify/bank', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab', // Token บอส
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payload: payload }) 
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
