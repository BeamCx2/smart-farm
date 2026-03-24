exports.handler = async (event, context) => {
  // 1. ตั้งค่า Header ให้รองรับการเรียกจากหน้าเว็บ (CORS)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // ดักการส่งแบบ OPTIONS (ที่ Browser มักจะส่งมาเช็คก่อน)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  // ใช้ ID/Secret จากรูปที่คุณส่งมาล่าสุด
  const consumerID = 'IL3TZXQLi63A4hNR74PbgPA3Y8X8eHFh';
  const consumerSecret = 'T5qKGFRaafb2Ig12';

  try {
    const credentials = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-test-mode': 'true',
        'env-id': 'OAUTH2' // เพิ่ม Header ตามที่หน้าเว็บ KBank ระบุ
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers, // ส่ง Header กลับไปด้วย
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
