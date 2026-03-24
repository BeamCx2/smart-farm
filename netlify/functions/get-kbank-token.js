exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    // 🚨 สำคัญมาก: เช็คให้ชัวร์ว่ารหัส 2 บรรทัดนี้ถูกต้อง ไม่มีเคาะวรรคหรือช่องว่างซ่อนอยู่!
    const consumerID = "IL3TZXQLi63A4hNR74PbgPA3Y8X8eHFh"; 
    const consumerSecret = "T5qKGFRAafb2Ig12";
    
    const authString = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

    // ใช้ v1.2 ตามที่เคยทำสำเร็จ
    const res = await fetch('https://openapi-sandbox.kasikornbank.com/v1.2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'env-id': 'OAUTH2' // ใส่กลับคืนมาเพื่อความชัวร์
      },
      body: 'grant_type=client_credentials'
    });

    const rawText = await res.text();
    console.log("Raw Token Response:", rawText);

    if (!res.ok) {
      throw new Error(`KBank ปฏิเสธ (Status: ${res.status}): ${rawText}`);
    }

    const data = JSON.parse(rawText);
    return { statusCode: 200, headers, body: JSON.stringify(data) };
    
  } catch (err) {
    console.error("Token Error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
