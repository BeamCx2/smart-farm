exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    // 🚨 ใส่รหัสใหม่ล่าสุดที่คุณเพิ่งกดมาตรงนี้!
    const consumerID = "IL3TZXQLi63A4hNR74PbgPA3Y8X8eHFh";
    const consumerSecret = "T5qKGFRAafb2Ig12";
    
    // แปลงรหัสเป็น Base64 ตามกฎของ KBank
    const authString = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

    const res = await fetch('https://openapi-sandbox.kasikornbank.com/v1.2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'env-id': 'OAUTH2' 
      },
      body: 'grant_type=client_credentials'
    });

    const data = await res.json();
    console.log("Token Response:", data);

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    console.error("Token Error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
