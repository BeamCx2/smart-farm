exports.handler = async (event, context) => {
  // อนุญาตให้เรียกจากหน้าเว็บได้ (CORS)
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
        'x-test-mode': 'true'
      },
      body: JSON.stringify({
        "partnerTxnUid": `SF${Date.now()}`,
        "partnerId": "PTR1051873",
        "partnerSecret": "d4bded58200547bc85903574a293831b",
        "requestDt": new Date().toISOString(),
        "merchantId": "KB102057148704",
        "qrType": "3",
        "unconfrimFlag": "Y",
        "billDetail": "Test 1 THB",
        "reference1": "INV001",
        "amount": amount.toFixed(2), // ต้องส่งเป็น 1.00
        "currencyCode": "THB"
      })
    });

    const data = await response.json();
    console.log("KBank Response:", data); // ดูผลลัพธ์ใน Netlify Log

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
