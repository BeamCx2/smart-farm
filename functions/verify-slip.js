const axios = require('axios');

exports.handler = async (event) => {
  // 🔒 เช็คว่าเป็น POST หรือเปล่า
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    const { imageBase64 } = JSON.parse(event.body);

    if (!imageBase64) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "No image data provided" }) 
      };
    }
    
    // 🚀 ส่งไปเช็คที่ EasySlip
    const response = await axios.post('https://developer.easyslip.com/api/v1/verify-direct', 
      { image: imageBase64 }, 
      {
        headers: { 
          // 🔑 สำคัญมาก: ต้องมีคำว่า Bearer นำหน้า Token เสมอครับบอส
          'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab', 
          'Content-Type': 'application/json'
        }
      }
    );

    // ส่งผลลัพธ์กลับไปให้หน้าบ้าน (React)
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response.data)
    };

  } catch (error) {
    console.error("EasySlip Error:", error.response ? error.response.data : error.message);
    return {
      statusCode: error.response ? error.response.status : 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Verification failed", 
        details: error.response ? error.response.data : error.message 
      })
    };
  }
};
