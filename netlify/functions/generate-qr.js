exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { accessToken } = JSON.parse(event.body);

    // 🚨 จุดไคลแม็กซ์รอบนี้: สร้างเวลาประเทศไทย (+07:00) เป๊ะๆ
    const now = new Date();
    // บวกเวลาเพิ่ม 7 ชั่วโมง (Netlify รันอยู่บนเวลา UTC)
    const localTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); 
    // ตัดเศษมิลลิวินาทีทิ้ง แล้วต่อท้ายด้วย +07:00
    const formattedDate = localTime.toISOString().split('.')[0] + "+07:00";

    const res = await fetch('https://openapi-sandbox.kasikornbank.com/v1/qrpayment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-test-mode': 'true',
        'env-id': 'QR002'
      },
      body: JSON.stringify({
        "partnerTxnUid": "PARTNERTEST0001", 
        "partnerId": "PTR1051673", 
        "partnerSecret": "d4bded59200547bc85903574a293831b",
        "requestDt": formattedDate, // ส่งเวลาไทยเข้าไป
        "merchantId": "KB102057149704", 
        "qrType": "3",
        "txnAmount": 1.00, 
        "txnCurrencyCode": "THB", 
        "reference1": "INV001",
        "reference2": "HELLOWORLD",
        "reference3": "INV001",
        "reference4": "INV001"
      })
    });

    const data = await res.json();
    console.log("KBank Response:", data);

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
