exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { accessToken } = JSON.parse(event.body);

    const res = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-test-mode': 'true',
        'env-id': 'QR002'
      },
      body: JSON.stringify({
        // 1. เลขรายการตามโจทย์
        "partnerTxnUid": "PARTNERTEST0001", 
        // 2. Partner ID ตามตัวอักษรสีแดงในรูป (เปลี่ยน 8 เป็น 6)
        "partnerId": "PTR1051673", 
        // 3. Partner Secret ตามตัวอักษรสีแดงในรูป
        "partnerSecret": "d4bded59200547bc85903574a293831b",
        "requestDt": new Date().toISOString(),
        // 4. Merchant ID ตามตัวอักษรสีแดงในรูป
        "merchantId": "KB102057149704", 
        "qrType": "3",
        "unconfrimFlag": "Y",
        "billDetail": "Test Payment",
        "reference1": "INV001",
        "amount": "1.00",
        "currencyCode": "THB"
      })
    });

    const data = await res.json();
    console.log("KBank Response:", data);

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
