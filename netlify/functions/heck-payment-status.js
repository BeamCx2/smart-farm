// netlify/functions/check-payment-status.js
exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { accessToken, partnerTxnUid } = JSON.parse(event.body);

    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/inquiry', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-test-mode': 'true',
        'env-id': 'QR002' // ต้องตรงกับตอนสร้าง QR
      },
      body: JSON.stringify({
        "partnerId": "PTR1051873",
        "partnerSecret": "d4bded58200547bc85903574a293831b",
        "partnerTxnUid": partnerTxnUid, // เลขเดียวกับที่ได้ตอนสร้าง QR
        "requestDt": new Date().toISOString(),
        "merchantId": "KB102057148704"
      })
    });

    const data = await response.json();
    console.log("Inquiry Response:", data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
