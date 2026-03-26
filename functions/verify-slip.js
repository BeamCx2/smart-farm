const axios = require('axios');

exports.handler = async (event) => {
  // 🔒 เช็คว่าเป็น POST หรือเปล่า
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { imageBase64 } = JSON.parse(event.body);
    
    // 🚀 ส่งไปเช็คที่ EasySlip
    const response = await axios.post('https://developer.easyslip.com/api/v1/verify-direct', 
      { image: imageBase64 }, 
      {
        headers: { 
          'Authorization': '929951ef-e7be-4b29-b441-7927e448d8ab', // 🔑 ใส่ Token ของบอสตรงนี้
          'Content-Type': 'application/json'
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
      body: JSON.stringify({ error: error.message })
    };
  }
};
