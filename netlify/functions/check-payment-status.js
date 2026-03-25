exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { accessToken, partnerTxnUid } = JSON.parse(event.body);

    const res = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/inquiry', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-test-mode': 'true',
        'env-id': 'QR002' // 🚨 ใส่ตัวนี้เข้าไปเพื่อให้ KBank ยอมคุยด้วย
      },
      body: JSON.stringify({
        "partnerTxnUid": partnerTxnUid,
        "partnerId": "PTR1051673", // รหัสเดียวกับที่ใช้สร้าง QR
        "partnerSecret": "d4bded59200547bc85903574a293831b",
        "requestDt": new Date().toISOString().split('.')[0] + "+07:00", // เวลาไทย
        "merchantId": "KB102057149704"
      })
    });

    const data = await res.json();
    console.log("Inquiry Response:", data);

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    console.error("Inquiry Error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
