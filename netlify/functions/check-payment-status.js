// ⚠️ NOTE: This function is for Easy Slip verification (if needed in future)
// Currently using PromptPay QR only via Firebase Cloud Functions (getscbqr)

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    // 📝 Placeholder for Easy Slip verification
    // Will implement when Easy Slip integration is needed
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Easy Slip verification not yet implemented",
        status: "placeholder"
      })
    };
  } catch (err) {
    console.error("Error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
