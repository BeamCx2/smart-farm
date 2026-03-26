const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// 1. ฟังก์ชันสร้าง QR Code (ปรับจูนพิเศษเพื่อลดโอกาส Crash)
exports.getSCBQR = functions.region('asia-southeast1')
  .runWith({ 
    timeoutSeconds: 30, // ให้เวลามันคิดนานขึ้นหน่อย
    memory: '256MB'     // เพิ่มแรงให้ฟังก์ชัน
  })
  .https.onCall(async (data, context) => {
    // 🛡️ ตรวจสอบการล็อกอิน
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'บอสครับ ต้องล็อกอินก่อนนะ!');
    }

    const { amount, orderId } = data;
    
    // 🔑 SCB Credentials (Sandbox)
    const API_KEY = 'l7e200e6b675044a0fb0efe597c09997b5';
    const API_SECRET = '1c5f9f1bf0914d8682345cb7e12ba687';
    const BILLER_ID = '386424808603569'; 

    try {
        // --- ขั้นตอนที่ 1: ขอ Access Token ---
        const authResponse = await axios.post('https://api-sandbox.partners.scb/partners/sandbox/v1/oauth/token', {
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

        // --- ขั้นตอนที่ 2: สร้าง QR Code ---
        // 🚨 จุดตาย: SCB Sandbox ต้องการยอดเงินที่เป็นทศนิยม 2 ตำแหน่งเป๊ะๆ ครับบอส
        const formattedAmount = Number(amount).toFixed(2);

        const qrResponse = await axios.post('https://api-sandbox.partners.scb/partners/sandbox/v1/payment/qrcode/create', {
            qrType: 'PP',
            amount: formattedAmount, // ✅ ส่งแบบ 108.00 ไม่ใช่ 108
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
        // 📑 พ่น Error ออกมาให้ละเอียดที่สุดใน Logs
        console.error('FULL ERROR LOG:', JSON.stringify(error.response?.data || error.message));
        throw new functions.https.HttpsError('internal', 'ติดต่อธนาคารไม่ได้ครับบอส เช็ค Logs ด่วน!');
    }
});

// 2. ฟังก์ชันรับสถานะการจ่ายเงิน (Webhook)
exports.scbCallback = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
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
            console.log(`Order ${orderId} status updated to PAID.`);
        }

        res.status(200).json({ resCode: '00', resDesc: 'success' });
    } catch (error) {
        console.error("Callback Error:", error);
        res.status(500).send("Error");
    }
});
