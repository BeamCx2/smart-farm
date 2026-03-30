exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            body: "Method Not Allowed" 
        };
    }

    try {
        const { amount, orderId } = JSON.parse(event.body);

        const response = await fetch('https://developer.easyslip.com/api/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab', // Token ของบอส
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,   // ยอดเงิน (เช่น 102.00)
                orderId: orderId, // เลขออเดอร์เพื่อผูกกับธุรกรรม
            })
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json", 
                "Access-Control-Allow-Origin": "*" // กันปัญหา CORS
            },
            body: JSON.stringify(data) 
        };

    } catch (error) {
        console.error("Generate QR Error:", error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};
