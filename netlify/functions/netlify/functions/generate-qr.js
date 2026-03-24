// netlify/functions/generate-qr.js

exports.handler = async (event, context) => {
  // 1. รับ access_token ที่ส่งมาจากหน้าเว็บ (หรือจะเรียกจากฟังก์ชัน token โดยตรงก็ได้)
  const { accessToken, amount } = JSON.parse(event.body);

  try {
    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`, // นำ Token มาใส่ตรงนี้
        'Content-Type': 'application/json',
        'x-test-mode': 'true'
      },
      body: JSON.stringify({
        "partnerTxnUid": `PARTNER${Date.now()}`, // สุ่มเลข Transaction
        "partnerId": "PTR1051873",               // ตามรูป Exercise 2
        "partnerSecret": "d4bded58200547bc85903574a293831b", // ตามรูป
        "requestDt": new Date().toISOString(),
        "merchantId": "KB102057148704",          // ตามรูป
        "qrType": "3",
        "unconfrimFlag": "Y",
        "billDetail": "Payment for Smart Farm",
        "reference1": "INV001",
        "amount": amount,                        // รับค่าเงินมาจากหน้าเว็บ
        "currencyCode": "THB"
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
