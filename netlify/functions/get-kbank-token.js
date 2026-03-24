exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    // ใช้รหัสใหม่ที่คุณเพิ่งได้มา
    const consumerID = "IL3TZXQLi63A4hNR74PbgPA3Y8X8eHFh"; 
    const consumerSecret = "T5qKGFRaafb2Ig12";
    
    const authString = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

    // 🚨 อัปเดต URL เป็น v2 ตามหน้าเว็บ KBank
    const res = await fetch('https://openapi-sandbox.kasikornbank.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'env-id': 'OAUTH2',
        'x-test-mode': 'true' // ใส่เพิ่มตามรูป
      },
      body: 'grant_type=client_credentials'
    });

    const rawText = await res.text();
    if (!res.ok) throw new Error(`Status ${res.status}: ${rawText}`);

    const data = JSON.parse(rawText);
    return { statusCode: 200, headers, body: JSON.stringify(data) };
    
  } catch (err) {
    console.error("Token Error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
