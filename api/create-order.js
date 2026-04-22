const https = require("https");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const KEY_ID     = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    return res.status(500).json({ error: "Razorpay credentials not configured" });
  }

  const { amount, notes } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({ error: "Amount must be at least 100 paise" });
  }

  const orderData = JSON.stringify({
    amount,
    currency: "INR",
    receipt:  "ct_" + Date.now(),
    notes:    notes || {}
  });

  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

  return new Promise((resolve) => {
    const request = https.request({
      hostname: "api.razorpay.com",
      path:     "/v1/orders",
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Authorization":  `Basic ${auth}`,
        "Content-Length": Buffer.byteLength(orderData),
      },
    }, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        if (response.statusCode === 200) {
          const order = JSON.parse(data);
          res.status(200).json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: KEY_ID });
        } else {
          res.status(500).json({ error: "Razorpay order creation failed", details: data });
        }
        resolve();
      });
    });
    request.on("error", (e) => { res.status(500).json({ error: e.message }); resolve(); });
    request.write(orderData);
    request.end();
  });
};
