const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_PASS) {
    return { statusCode: 500, body: JSON.stringify({ error: "Email credentials not configured" }) };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });

  const { type, name, contact, message, productType, colour, idea } = body;

  let subject, htmlEmail;

  if (type === "contact") {
    subject = `📩 New Message from ${name} — Crank Theory`;
    htmlEmail = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#111;border:1px solid rgba(255,98,0,0.3)">
    <div style="background:#FF6200;padding:24px 32px">
      <h1 style="margin:0;font-size:1.8rem;letter-spacing:4px;color:#000;font-weight:900">CRANK&#183;THEORY</h1>
      <p style="margin:6px 0 0;font-size:.85rem;letter-spacing:3px;color:#000;text-transform:uppercase">New Contact Message</p>
    </div>
    <div style="padding:32px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px 0;color:#888;font-size:.9rem;width:140px">From</td><td style="padding:10px 0;color:#f5f5f5;font-size:.9rem"><strong>${name}</strong></td></tr>
        <tr><td style="padding:10px 0;color:#888;font-size:.9rem">Email / Phone</td><td style="padding:10px 0;color:#FF6200;font-size:.9rem">${contact}</td></tr>
      </table>
      <div style="margin-top:24px">
        <div style="font-size:.75rem;letter-spacing:4px;text-transform:uppercase;color:#FF6200;margin-bottom:10px">Message</div>
        <div style="background:#181818;border-left:3px solid #FF6200;padding:16px;color:#f5f5f5;font-size:.95rem;line-height:1.7">${message}</div>
      </div>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #222;text-align:center">
      <p style="margin:0;color:#555;font-size:.8rem">Crank Theory &bull; cranktheory07@gmail.com</p>
    </div>
  </div>
</body>
</html>`;
  } else {
    subject = `🎨 New Custom Order Request from ${name} — Crank Theory`;
    htmlEmail = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#111;border:1px solid rgba(255,98,0,0.3)">
    <div style="background:#FF6200;padding:24px 32px">
      <h1 style="margin:0;font-size:1.8rem;letter-spacing:4px;color:#000;font-weight:900">CRANK&#183;THEORY</h1>
      <p style="margin:6px 0 0;font-size:.85rem;letter-spacing:3px;color:#000;text-transform:uppercase">New Custom Order Request</p>
    </div>
    <div style="padding:32px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px 0;color:#888;font-size:.9rem;width:160px">Customer Name</td><td style="padding:10px 0;color:#f5f5f5;font-size:.9rem"><strong>${name}</strong></td></tr>
        <tr><td style="padding:10px 0;color:#888;font-size:.9rem">Email / Phone</td><td style="padding:10px 0;color:#FF6200;font-size:.9rem">${contact}</td></tr>
        <tr><td style="padding:10px 0;color:#888;font-size:.9rem">Product Type</td><td style="padding:10px 0;color:#f5f5f5;font-size:.9rem">${productType || '—'}</td></tr>
        <tr><td style="padding:10px 0;color:#888;font-size:.9rem">Preferred Colour</td><td style="padding:10px 0;color:#f5f5f5;font-size:.9rem">${colour || '—'}</td></tr>
      </table>
      <div style="margin-top:24px">
        <div style="font-size:.75rem;letter-spacing:4px;text-transform:uppercase;color:#FF6200;margin-bottom:10px">Their Idea</div>
        <div style="background:#181818;border-left:3px solid #FF6200;padding:16px;color:#f5f5f5;font-size:.95rem;line-height:1.7">${idea || '—'}</div>
      </div>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #222;text-align:center">
      <p style="margin:0;color:#555;font-size:.8rem">Crank Theory &bull; cranktheory07@gmail.com</p>
    </div>
  </div>
</body>
</html>`;
  }

  try {
    await transporter.sendMail({
      from: `"Crank Theory" <${GMAIL_USER}>`,
      to:   GMAIL_USER,
      replyTo: contact.includes('@') ? contact : GMAIL_USER,
      subject,
      html: htmlEmail,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("Email error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
