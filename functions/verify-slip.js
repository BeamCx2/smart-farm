exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const base64Image = body.image;

        const response = await fetch('https://developer.easyslip.com/api/v2/verify', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 929951ef-e7be-4b29-b441-7927e448d8ab', // Token บอส
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: base64Image }) 
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("V2 Verify Error:", error);
        return { 
            statusCode: 200, 
            body: JSON.stringify({ 
                status: 500, 
                message: "Internal Server Error: " + error.message 
            }) 
        };
    }
};
