// netlify/functions/get-kbank-token.js

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  // ตรวจสอบ ID/Secret: ห้ามมีเว้นวรรคเด็ดขาด!
  // คัดลอกมาจาก Exercise 1 ให้แม่นยำครับ
  const consumerID = 'IL3TZXQLi63A4hNR74PbgPA3Y8X8eHFh'; 
  const consumerSecret = 'T5qKGFRaafb2Ig12';

  try {
    const credentials = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

    const response = await fetch('https://openapi-sandbox.kasikornbank.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-test-mode': 'true'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    console.log("KBank Token Response:", data);

    return {
      statusCode: 200,
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
