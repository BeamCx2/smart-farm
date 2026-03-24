exports.handler = async (event, context) => {
  const consumerID = 'IL3TZXQLi63A4hNR74PbgPA3Y8X8eHFh';
  const consumerSecret = 'T5qKGFRaafb2Ig12';
  // ใช้ Buffer เพื่อทำ Base64
  const credentials = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

  try {
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

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch token', details: error.message })
    };
  }
};
