// netlify/functions/generate-qr.js

    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-test-mode': 'true',
        'env-id': 'QR002' // <--- เพิ่มบรรทัดนี้เข้าไปครับ!!
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
        "amount": parseFloat(amount).toFixed(2),
        "currencyCode": "THB"
      })
    });
