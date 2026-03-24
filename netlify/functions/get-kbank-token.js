// netlify/functions/get-kbank-token.js

exports.handler = async (event, context) => {
  // 1. ตรวจสอบ Consumer ID และ Secret (ห้ามมีเว้นวรรค)
  const consumerID = 'IL3TZXQLi63A4hNR74PbgPA3Y8X8eHFh'; 
  const consumerSecret = 'T5qKGFRaafb2Ig12';

  // 2. สร้าง Credentials สำหรับ Basic Auth
  const credentials = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

  // 3. เตรียม Body ในรูปแบบ x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  try {
    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-test-mode': 'true'
      },
      body: params.toString()
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // อนุญาตให้หน้าเว็บเรียกใช้ได้
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch token', details: error.message })
    };
  }
};
