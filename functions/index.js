const { onCall, onRequest } = require("firebase-functions/v2/https"); // ✅ ใช้ v2
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// ตั้งค่า Region เป็นสิงคโปร์แบบ Global ไปเลยครับบอส ง่ายดี
setGlobalOptions({ region: "asia-southeast1" });

// 1. ฟังก์ชันสร้าง QR Code (v2 style)
exports.getscbqr = onCall({ 
    timeoutSeconds: 30, 
    memory: "256MiB",
    cors: true // เปิดให้หน้าบ้านคุยได้ชัวร์ๆ
}, async (request) => {
    // ใน v2 ข้อมูลจะอยู่ใน request.data และ context จะอยู่ใน request.auth
    if (!request.auth) {
        throw new Error("unauthenticated: บอสครับ ต้องล็อกอินก่อนนะ!");
    }

    const { amount, orderId } = request.data;
    const API_KEY = 'l7e200e6b675044a0fb0efe597c09997b5';
    const API_SECRET = '1c5f9f1bf0914d8682345cb7e12ba687';
    const BILLER_ID = '386424808603569'; 

    try {
        const authResponse = await axios.post('https://api-sandbox.partners.scb/partners/sandbox/v1/oauth/819e2c00-bb0e-4a2b-8e5d-1979f5998b9e', {
            applicationKey: API_KEY,
            applicationSecret: API_SECRET
        }, {
            headers: {
                'Content-Type': 'application/json',
                'resourceOwnerId': API_KEY,
                'requestUId': `REQ-${Date.now()}`
            }
        });

        const accessToken = authResponse.data.data.accessToken;
        const formattedAmount = Number(amount).toFixed(2);

        const qrResponse = await axios.post('https://api-sandbox.partners.scb/partners/sandbox/v1/payment/qrcode/create', {
            qrType: 'PP',
            amount: formattedAmount,
            ppId: BILLER_ID,
            ppType: 'BILLERID',
            reference1: orderId.substring(0, 20),
            reference2: 'SMARTFARM'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`,
                'resourceOwnerId': API_KEY,
                'requestUId': `REQ-${Date.now()}`,
                'accept-language': 'EN'
            }
        });

        return { qrRawData: qrResponse.data.data.qrRawData };

    } catch (error) {
        console.error('SCB API Error:', error.response?.data || error.message);
        return { error: "ติดต่อธนาคารไม่ได้ครับบอส" };
    }
});

// 2. ฟังก์ชัน Webhook (v2 style)
exports.scbcallback = onRequest(async (req, res) => {
    const paymentData = req.body;
    const orderId = paymentData.billPaymentRef1;

    try {
        const ordersRef = admin.firestore().collection('orders');
        const snapshot = await ordersRef.where('orderId', '==', orderId).limit(1).get();

        if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            await ordersRef.doc(docId).update({
                status: 'paid',
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                scbTransactionId: paymentData.transRef
            });
        }
        res.status(200).json({ resCode: '00', resDesc: 'success' });
    } catch (error) {
        console.error("Callback Error:", error);
        res.status(500).send("Error");
    }
});
