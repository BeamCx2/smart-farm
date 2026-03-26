const axios = require('axios');

exports.handler = async (event) => {
  // 🔒 1. ตรวจสอบ Method (ต้องเป็น POST เท่านั้น)
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    // 📦 2. รับข้อมูลรูปภาพ Base64 จากหน้าบ้าน
    const body = JSON.parse(event.body);
    const { imageBase64 } = body;

    if (!imageBase64) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "ไม่พบข้อมูลรูปภาพ (imageBase64 is missing)" }) 
      };
    }

    // 🚀 3. ส่งไปเช็คที่ EasySlip (ใช้ Endpoint verify-direct)
    // หมายเหตุ: EasySlip ต้องการฟิลด์ชื่อ "image" ใน Body
    const response = await axios.post('https://developer.easyslip.com/api/v1/verify-direct', 
      { 
        image: imageBase64  // 👈 ตรวจสอบว่าชื่อฟิลด์ถูกต้อง
      }, 
      {
        headers: { 
          // 🔑 ใส่ Token ของบอส (ต้องมี Bearer นำหน้า)
          'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab', 
          'Content-Type': 'application/json'
        },
        timeout: 10000 // เพิ่ม Timeout เป็น 10 วินาทีกันค้าง
      }
    );

    // ✅ 4. ส่งผลลัพธ์กลับไปที่ React
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response.data)
    };

  } catch (error) {
    // 🚨 5. ส่วนดักจับ Error (จุดที่บอสเจอ 404 จะมาโผล่ตรงนี้)
    const errorStatus = error.response ? error.response.status : 500;
    const errorData = error.response ? error.response.data : { message: error.message };
    
    console.error("❌ EasySlip Error Detail:", errorData);

    return {
      statusCode: errorStatus,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Verification failed", 
        status: errorStatus,
        message: errorData.message || "เกิดข้อผิดพลาดในการตรวจสอบสลิป"
      })
    };
  }
};
