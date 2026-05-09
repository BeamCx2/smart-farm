exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { accessToken } = JSON.parse(event.body);

    // ✅ ดึง KBank credentials จาก environment variables
    const partnerId = process.env.KBANK_PARTNER_ID;
    const partnerSecret = process.env.KBANK_PARTNER_SECRET;
    const merchantId = process.env.KBANK_MERCHANT_ID;

    if (!partnerId || !partnerSecret || !merchantId) {
      throw new Error('ไม่พบการตั้งค่า KBank credentials ใน environment variables');
    }

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
        "partnerId": partnerId,
        "partnerSecret": partnerSecret,
        "requestDt": formattedDate,
        "merchantId": merchantId,
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
