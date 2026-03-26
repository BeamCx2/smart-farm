const axios = require('axios');

exports.handler = async (event) => {
    try {
        const { payload } = JSON.parse(event.body);
        
        const response = await axios.post('https://api.easyslip.com/v2/verify/bank', 
            { payload: payload }, 
            {
                headers: { 
                    'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab',
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            statusCode: 200,
            body: JSON.stringify(response.data) // ส่งก้อน V2 กลับไปให้หน้าบ้านทั้งหมด
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
