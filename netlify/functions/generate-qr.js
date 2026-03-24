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
        "partnerTxnUid": "PARTNERTEST0001", 
        "partnerId": "PTR1051673", 
        "partnerSecret": "d4bded59200547bc85903574a293831b",
        "requestDt": new Date().toISOString(),
        "merchantId": "KB102057149704", 
        "qrType": "3",
        // 🚨 จุดไคลแม็กซ์: เปลี่ยนชื่อจาก amount เป็น txnAmount และส่งเป็นตัวเลข
        "txnAmount": 1.00, 
        "currencyCode": "THB",
        "reference1": "INV001",
        "reference2": "HELLOWORLD",
        "reference3": "INV001",
        "reference4": "INV001"
      })
    });

    const data = await res.json();
    console.log("KBank Response:", data);

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
