// netlify/functions/generate-qr.js

exports.handler = async (event, context) => {
  // 1. ตั้งค่า Headers สำหรับ CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    // 2. รับข้อมูลจากหน้าบ้าน
    const { accessToken, amount } = JSON.parse(event.body);

    // 3. ส่ง Request ไปหา KBank (ปรับปรุง partnerTxnUid ให้สั้นลงตามกฎ Sandbox)
    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-test-mode': 'true',
        'env-id': 'QR002' 
      },
      body: JSON.stringify({
        // แก้ไข: ใช้รูปแบบ TXN + ตัวเลขสั้นๆ เพื่อให้ผ่านการตรวจสอบ Exercise 2
        "partnerTxnUid": "TXN" + Math.floor(Math.random() * 1000000), 
        "partnerId": "PTR1051873",
        "partnerSecret": "d4bded58200547bc85903574a293831b",
        "requestDt": new Date().toISOString(),
        "merchantId": "KB102057148704",
        "qrType": "3",
        "unconfrimFlag": "Y",
        "billDetail": "Test Payment 1 THB",
        "reference1": "INV001", 
        "amount": parseFloat(amount).toFixed(2), 
        "currencyCode": "THB"
      })
    });

    const data = await response.json();
    console.log("KBank Response Detail:", data); 

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
