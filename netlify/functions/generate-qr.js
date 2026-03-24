// netlify/functions/generate-qr.js

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { accessToken, amount } = JSON.parse(event.body);

    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-test-mode': 'true',
        'env-id': 'QR002' 
      },
      body: JSON.stringify({
        // แก้ไข: เปลี่ยนจาก TXN เป็น TR ตามกฎของ Exercise 2 
        // และใช้ตัวเลข 5 หลักเพื่อไม่ให้ยาวเกินไป
        "partnerTxnUid": "TR" + Math.floor(10000 + Math.random() * 90000), 
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
    console.error("
