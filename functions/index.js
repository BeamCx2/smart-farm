const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const generatePayload = require('promptpay-qr');
const axios = require('axios');

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

// Exchange OAuth2 authorization code for tokens (server-side)
exports.exchangeGoogleToken = onCall({ cors: true }, async (request) => {
    const data = request.data || {};
    const { code, redirect_uri } = data;

    if (!code) {
        throw new Error('Missing authorization code');
    }

    // Prefer environment vars; fall back to Firebase functions config if set
    const clientId = process.env.GOOGLE_CLIENT_ID || (process.env.FUNCTIONS_EMULATOR ? null : (process.env.GCLOUD_PROJECT && (process.env.GOOGLE_CLIENT_ID)));
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || null;

    if (!clientId || !clientSecret) {
        throw new Error('Server not configured with Google client credentials');
    }

    try {
        const resp = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirect_uri || `https://smart-farm-c69be.firebaseapp.com/__/auth/handler`,
            grant_type: 'authorization_code'
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return resp.data;
    } catch (err) {
        console.error('Token exchange error', err?.response?.data || err.message || err);
        throw new Error('Token exchange failed: ' + (err?.response?.data?.error_description || err.message));
    }
});