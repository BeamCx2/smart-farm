// netlify/functions/get-kbank-token.js
const axios = require('axios');

exports.handler = async (event, context) => {
  const consumerID = 'suDxvMLTLYsQwLTROL9UL1mBCenibmcr';
  const consumerSecret = 'gOOfPtGLoGxYP3DG';
  const credentials = Buffer.from(`${consumerID}:${consumerSecret}`).toString('base64');

  try {
    const response = await axios.post('https://openapi-sandbox.kasikornbank.com/v2/oauth/token', 
      'grant_type=client_credentials', 
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-test-mode': 'true'
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch token' })
    };
  }
};
