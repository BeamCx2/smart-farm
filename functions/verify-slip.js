const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { payload } = JSON.parse(event.body);

    if (!payload) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "ไม่พบข้อมูล QR Payload" }) 
      };
    }

    // 🚀 เรียกใช้ EasySlip API v2 ตามที่บอสส่งมา
    const response = await axios.post('https://api.easyslip.com/v2/verify/bank', 
      { 
        payload: payload // 👈 ส่งค่า QR Payload ที่สแกนได้จากสลิป
      }, 
      {
        headers: { 
          'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab', // 🔑 ใส่ Key บอสตรงนี้
          'Content-Type': 'application/json'
        },
        timeout: 10000 
      }
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response.data)
    };

  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const data = error.response ? error.response.data : { message: error.message };
    
    return {
      statusCode: status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  }
};
