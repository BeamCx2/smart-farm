const axios = require('axios');

exports.handler = async (event) => {
    try {
        const { payload } = JSON.parse(event.body);
        const response = await axios.post('https://developer.easyslip.com/api/v2/verify', 
            { payload }, 
            {
                headers: { 'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab' }
            }
        );

        // ✅ ส่งกลับไปแบบนี้ครับบอส
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: response.data.status === 200,
                data: response.data.data // ส่งก้อน data ไปทั้งหมด
            })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
    }
};
