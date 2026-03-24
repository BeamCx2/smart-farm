exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const consumerID = "IL3TZXQLi63A4hNR74PbgPA3Y8X8eHFh";
    const consumerSecret = "T5qKGFRAafb2Ig12";
    
    // แปลงรหัสเป็น Base64
    const authString = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

    // ใช้ v2 ตามมาตรฐานของ KBank API ใหม่ล่าสุด
    const res = await fetch('https://openapi-sandbox.kasikornbank.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    // 🚨 อ่านข้อความดิบๆ ออกมาก่อน เพื่อป้องกัน JSON.parse Error
    const rawText = await res.text();
    console.log("Raw Token Response (ดูตรงนี้):", rawText);
    console.log("Status Code:", res.status);

    if (!rawText) {
      throw new Error(`KBank ส่งค่าว่างเปล่า (Status: ${res.status}) - อาจจะ URL ผิด หรือรหัสไม่ถูกต้อง`);
    }

    const data = JSON.parse(rawText);
    return { statusCode: 200, headers, body: JSON.stringify(data) };
    
  } catch (err) {
    console.error("Token Error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
