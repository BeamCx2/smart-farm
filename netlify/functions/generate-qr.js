// netlify/functions/generate-qr.js

exports.handler = async (event, context) => {
  // 1. ตั้งค่า Headers สำหรับ CORS เพื่อให้หน้าเว็บเรียกใช้ได้
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // ดักจับ Browser ที่ส่งคำขอแบบ OPTIONS มาเช็คความปลอดภัยก่อน
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    // 2. รับข้อมูลที่ส่งมาจากหน้าเว็บ (App.jsx)
    const { accessToken, amount } = JSON.parse(event.body);

    // 3. ส่ง Request ไปหา KBank
    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-test-mode': 'true',
        'env-id': 'QR002' // แก้ไขตามที่ Log แจ้งเตือน (ด่านสำคัญ!)
      },
      body: JSON.stringify({
        "partnerTxnUid": `SF${Date.now()}`,
        "partnerId": "PTR1051873",
        "partnerSecret": "d4bded58200547bc85903574a293831b",
        "requestDt": new Date().toISOString(),
        "merchantId": "KB102057148704",
        "qrType": "3",
        "unconfrimFlag": "Y",
        "billDetail": "Test Payment 1 THB",
        "reference1": "INV" + Math.floor(Math.random() * 1000),
        "amount": parseFloat(amount).toFixed(2), // บังคับรูปแบบ 1.00
        "currencyCode": "THB"
      })
    });

    const data = await response.json();
    console.log("KBank Response Detail:", data); // ดูผลลัพธ์ใน Netlify Log

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
