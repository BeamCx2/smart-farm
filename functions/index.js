const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const generatePayload = require('promptpay-qr');

// เริ่มต้น Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// 🚨 สำคัญมาก: ต้องตรงกับหน้าบ้าน (สิงคโปร์)
setGlobalOptions({ region: "asia-southeast1" });

exports.getscbqr = onCall({ cors: true }, async (request) => {
    const { amount } = request.data;
    
    // � ดึงเบอร์โทร PromptPay จาก environment variables
    const mobileNumber = process.env.PROMPTPAY_MOBILE || process.env.VITE_PROMPTPAY_MOBILE;
    
    if (!mobileNumber) {
        throw new Error('ไม่พบการตั้งค่า PromptPay mobile number');
    }
    
    try {
        console.log(`Generating PromptPay QR for amount: ${amount}`);
        
        // เจนค่า Payload (ข้อความดิบ) สำหรับ PromptPay
        const payload = generatePayload(mobileNumber, { amount: Number(amount) });

        // ส่งกลับไปในชื่อเดิม หน้าบ้านจะได้ไม่ต้องแก้เยอะ
        return { qrRawData: payload };

    } catch (error) {
        console.error('PromptPay Error:', error);
        return { error: "เจน QR ไม่สำเร็จครับบอส", details: error.message };
    }
});