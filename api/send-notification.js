const nodemailer = require("nodemailer");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_PASS) {
    return res.status(500).json({ error: "Email credentials not configured" });
  }

  const { payment_id, order_id, amount, name, phone, email, addr1, addr2, city, pin, state, cart } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });

  const cartRows = (cart || []).map(item =>
    `<tr>
      <td style="padding:10px;border-bottom:1px solid #222;color:#f5f5f5">${item.name}</td>
      <td style="padding:10px;border-bottom:1px solid #222;color:#f5f5f5;text-align:center">${item.qty}</td>
      <td style="padding:10px;border-bottom:1px solid #222;color:#FF6200;text-align:right">&#8377;${(item.price * item.qty).toLocaleString('en-IN')}</td>
    </tr>`
  ).join("");

  const totalAmount = (cart || []).reduce((s, i) => s + i.price * i.qty, 0);

  const htmlEmail = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Arial',sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#111;border:1px solid rgba(255,98,0,0.3)">
    <div style="background:#FF6200;padding:24px 32px;text-align:center">
      <h1 style="margin:0;font-size:2rem;letter-spacing:4px;color:#000;font-weight:900">CRANK&#183;THEORY</h1>
      <p style="margin:6px 0 0;font-size:.85rem;letter-spacing:3px;color:#000;text-transform:uppercase">New Order Received!</p>
    </div>
    <div style="padding:24px 32px;border-bottom:1px solid #222">
      <h2 style="margin:0 0 16px;font-size:.75rem;letter-spacing:4px;text-transform:uppercase;color:#FF6200">Payment Details</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;font-size:.85rem">Payment ID</td><td style="padding:6px 0;color:#f5f5f5;text-align:right"><strong>${payment_id}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:.85rem">Order ID</td><td style="padding:6px 0;color:#f5f5f5;text-align:right">${order_id}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:.85rem">Amount Paid</td><td style="padding:6px 0;color:#FF6200;font-size:1.2rem;font-weight:bold;text-align:right">&#8377;${totalAmount.toLocaleString('en-IN')}</td></tr>
      </table>
    </div>
    <div style="padding:24px 32px;border-bottom:1px solid #222">
      <h2 style="margin:0 0 16px;font-size:.75rem;letter-spacing:4px;text-transform:uppercase;color:#FF6200">Customer Details</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;font-size:.85rem">Name</td><td style="padding:6px 0;color:#f5f5f5;text-align:right">${name}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:.85rem">Phone</td><td style="padding:6px 0;color:#f5f5f5;text-align:right">${phone}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:.85rem">Email</td><td style="padding:6px 0;color:#f5f5f5;text-align:right">${email}</td></tr>
      </table>
    </div>
    <div style="padding:24px 32px;border-bottom:1px solid #222">
      <h2 style="margin:0 0 16px;font-size:.75rem;letter-spacing:4px;text-transform:uppercase;color:#FF6200">&#128666; Shipping Address</h2>
      <p style="margin:0;color:#f5f5f5;font-size:.9rem;line-height:1.8;background:#181818;padding:16px;border-left:3px solid #FF6200">
        <strong>${name}</strong><br/>
        ${addr1}${addr2 ? '<br/>' + addr2 : ''}<br/>
        ${city}, ${state} - ${pin}<br/>
        &#128222; ${phone}
      </p>
    </div>
    <div style="padding:24px 32px;border-bottom:1px solid #222">
      <h2 style="margin:0 0 16px;font-size:.75rem;letter-spacing:4px;text-transform:uppercase;color:#FF6200">&#128722; Items Ordered</h2>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#222">
          <th style="padding:10px;text-align:left;color:#888;font-size:.75rem;letter-spacing:2px;text-transform:uppercase">Product</th>
          <th style="padding:10px;text-align:center;color:#888;font-size:.75rem;letter-spacing:2px;text-transform:uppercase">Qty</th>
          <th style="padding:10px;text-align:right;color:#888;font-size:.75rem;letter-spacing:2px;text-transform:uppercase">Price</th>
        </tr></thead>
        <tbody>${cartRows}</tbody>
        <tfoot><tr style="background:#181818">
          <td colspan="2" style="padding:14px 10px;color:#888;font-size:.85rem;letter-spacing:2px;text-transform:uppercase">Total</td>
          <td style="padding:14px 10px;color:#FF6200;font-size:1.3rem;font-weight:bold;text-align:right">&#8377;${totalAmount.toLocaleString('en-IN')}</td>
        </tr></tfoot>
      </table>
    </div>
    <div style="padding:20px 32px;text-align:center">
      <p style="margin:0;color:#555;font-size:.8rem">Crank Theory &bull; cranktheory07@gmail.com &bull; @cranktheory07</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from:    `"Crank Theory Orders" <${GMAIL_USER}>`,
      to:      GMAIL_USER,
      subject: `🔥 New Order ₹${totalAmount.toLocaleString('en-IN')} — ${name} | Crank Theory`,
      html:    htmlEmail,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return res.status(500).json({ error: err.message });
  }
}
