const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// 1. ฟังก์ชันสร้าง QR Code (อันเดิมที่บอสส่งมา ผมปรับจูนนิดหน่อยครับ)
exports.getSCBQR = functions.region('asia-southeast1').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'บอสครับ ต้องล็อกอินก่อนนะ!');
    }

    const { amount, orderId } = data;
    const API_KEY = 'l7e200e6b675044a0fb0efe597c09997b5';
    const API_SECRET = '1c5f9f1bf0914d8682345cb7e12ba687';
    const BILLER_ID = '386424808603569'; // 👈 บอสเอา Biller ID จากหน้า SCB มาใส่ตรงนี้นะครับ

    try {
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

        const qrResponse = await axios.post('https://api-sandbox.partners.scb/partners/sandbox/v1/payment/qrcode/create', {
            qrType: 'PP',
            amount: amount.toString(),
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
        throw new functions.https.HttpsError('internal', 'ติดต่อธนาคารไม่ได้ครับบอส');
    }
});

// 2. ฟังก์ชันรับสถานะการจ่ายเงิน (URL ที่บอสต้องเอาไปใส่ในหน้า SCB)
exports.scbCallback = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
    const paymentData = req.body;
    const orderId = paymentData.billPaymentRef1; // reference1 ที่เราส่งไปตอนสร้าง QR

    try {
        const ordersRef = admin.firestore().collection('orders');
        const snapshot = await ordersRef.where('orderId', '==', orderId).limit(1).get();

        if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            await ordersRef.doc(docId).update({
                status: 'paid', // ✅ เปลี่ยนสถานะเป็นจ่ายแล้ว!
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                scbTransactionId: paymentData.transRef
            });
            console.log(`Order ${orderId} is now PAID.`);
        }

        // ต้องตอบกลับ SCB ตาม Format นี้เท่านั้นครับ
        res.status(200).json({ resCode: '00', resDesc: 'success' });
    } catch (error) {
        console.error("Callback Error:", error);
        res.status(500).send("Error");
    }
});