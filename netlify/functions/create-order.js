const https = require("https");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const KEY_ID     = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: "Razorpay credentials not configured" }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const amount = parseInt(body.amount);
  if (!amount || amount < 100) {
    return { statusCode: 400, body: JSON.stringify({ error: "Amount must be at least 100 paise (₹1)" }) };
  }

  const orderData = JSON.stringify({
    amount,
    currency: "INR",
    receipt:  "ct_" + Date.now(),
  });

  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.razorpay.com",
        path:     "/v1/orders",
        method:   "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Basic ${auth}`,
          "Content-Length": Buffer.byteLength(orderData),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            const order = JSON.parse(data);
            resolve({
              statusCode: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_id: order.id, amount: order.amount, currency: order.currency }),
            });
          } else {
            resolve({ statusCode: 500, body: JSON.stringify({ error: "Razorpay order creation failed", details: data }) });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) }));
    req.write(orderData);
    req.end();
  });
};
