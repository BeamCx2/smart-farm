exports.handler = async (event) => {
    // 🛡️ เช็ค Method
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { amount, orderId } = JSON.parse(event.body);

        // 🚀 เรียก EasySlip API V2 เพื่อสร้าง QR PromptPay
        const response = await fetch('https://developer.easyslip.com/api/v2/generate', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab', // Token บอส
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: parseFloat(amount), // มั่นใจว่าเป็นตัวเลข decimal
                orderId: orderId,           // เลขออเดอร์จะถูกบันทึกไว้ในระบบ EasySlip
                // บอสสามารถเพิ่ม callbackUrl ได้ถ้าต้องการให้ EasySlip ยิงหาเซิร์ฟเวอร์โดยตรง
            })
        });

        const result = await response.json();

        // 📤 ส่งก้อนข้อมูลกลับไปให้หน้าบ้าน (QRCodeCanvas)
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify(result) 
        };

    } catch (error) {
        console.error("V2 Generate QR Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};
