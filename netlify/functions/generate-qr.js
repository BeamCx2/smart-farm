// netlify/functions/generate-qr.js

exports.handler = async (event, context) => {
  // รับข้อมูลจากหน้าบ้าน (accessToken และ amount)
  const { accessToken, amount } = JSON.parse(event.body);

  try {
    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-test-mode': 'true'
      },
      body: JSON.stringify({
        "partnerTxnUid": `SMARTFARM${Date.now()}`,
        "partnerId": "PTR1051873", // จากรูป Exercise 2
        "partnerSecret": "d4bded58200547bc85903574a293831b", // จากรูป Exercise 2
        "requestDt": new Date().toISOString(),
        "merchantId": "KB102057148704", // จากรูป Exercise 2
        "qrType": "3",
        "unconfrimFlag": "Y",
        "billDetail": "Payment for Smart Farm 1 THB",
        "reference1": "INV001",
        "amount": amount.toFixed(2), // บังคับทศนิยม 2 ตำแหน่ง เช่น 1.00
        "currencyCode": "THB"
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
