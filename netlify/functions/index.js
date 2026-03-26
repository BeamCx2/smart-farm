const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// ฟังก์ชันสำหรับขอ QR Code จาก SCB Sandbox
exports.getSCBQR = functions.https.onCall(async (data, context) => {
    const { amount, orderId } = data;

    // 🚨 บอสเอาข้อมูลจากหน้า SCB Developer มาใส่ 3 ช่องนี้ครับ
    const API_KEY = 'ใส่ API Key ตรงนี้'; 
    const API_SECRET = 'ใส่ API Secret ตรงนี้';
    const BILLER_ID = 'ใส่ Biller ID ตรงนี้';

    try {
        // 1. ขอ Access Token จาก SCB
        const authResponse = await axios.post('https://api-sandbox.scb.co.th/v1/oauth/token', {
            applicationKey: API_KEY,
            applicationSecret: API_SECRET
        }, {
            headers: {
                'Content-Type': 'application/json',
                'resourceOwnerId': API_KEY,
                'requestID': `REQ-${orderId}` // เลขอ้างอิงคำขอ
            }
        });

        const accessToken = authResponse.data.data.accessToken;

        // 2. สร้าง QR Code (แบบฝังยอดเงิน)
        const qrResponse = await axios.post('https://api-sandbox.scb.co.th/v1/payment/qrcode/create', {
            qrType: 'PP',
            amount: amount.toFixed(2), // บังคับทศนิยม 2 ตำแหน่ง
            ppId: BILLER_ID,
            ppType: 'BILLERID',
            ref1: orderId,         // เลขที่ออเดอร์
            ref2: 'SMARTFARM',    // ข้อมูลเพิ่มเติม
            ref3: 'SCB'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`,
                'resourceOwnerId': API_KEY,
                'requestID': `QR-${orderId}`
            }
        });

        // ส่งข้อมูล Raw Data กลับไปให้หน้าบ้านเพื่อเจนเป็นรูป
        return { qrRawData: qrResponse.data.data.qrRawData };

    } catch (error) {
        console.error("SCB Error Detail:", error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', 'สร้าง QR Code ไม่สำเร็จ กรุณาลองใหม่');
    }
});