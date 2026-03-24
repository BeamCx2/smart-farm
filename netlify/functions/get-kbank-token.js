exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  // ใช้ ID และ Secret จากรูป App Detail ล่าสุดของคุณ
  // ตรวจสอบให้ดีว่าไม่มี "เว้นวรรค" ติดมาในตัวแปร
  const consumerID = 'IL3TZXQLi63A4hNR74PbgPA3Y8X8eHFh'; 
  const consumerSecret = 'T5qKGFRaafb2Ig12';

  try {
    // 1. เข้ารหัส Credentials
    const credentials = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

    // 2. เรียก API (เพิ่ม env-id ตามที่หน้าเว็บ Sandbox แนะนำ)
    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-test-mode': 'true',
        'env-id': 'OAUTH2' // สำคัญ: ลองเพิ่มตามคำแนะนำในหน้าเว็บ KBank
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    
    // ถ้า KBank ตอบกลับมาเป็น Error เราจะส่ง HTTP 400 กลับไปให้หน้าบ้านรู้
    const statusCode = data.access_token ? 200 : 400;

    return {
      statusCode: statusCode,
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
