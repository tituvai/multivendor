const { sendEmail } = require("./emailUtils");

// ════════════════════════════════════════════════════════
// Vendor Application Received
// ════════════════════════════════════════════════════════
const sendVendorApplicationEmail = async (user) => {
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 30px;text-align:center}
      .hdr h1{color:#fff;margin:0;font-size:26px} .hdr p{color:#a0aec0;margin:8px 0 0;font-size:14px}
      .body{padding:40px 30px} .body p{color:#4a5568;line-height:1.7;font-size:15px}
      .badge{display:inline-block;background:#ebf8ff;color:#2b6cb0;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600}
      .steps{background:#f7fafc;border-radius:8px;padding:20px 24px;margin:20px 0}
      .steps li{color:#4a5568;margin:8px 0;font-size:14px}
      .footer{background:#f7fafc;padding:20px 30px;text-align:center}
      .footer p{color:#a0aec0;font-size:12px;margin:0}
    </style></head><body>
    <div class="wrap">
      <div class="hdr"><h1>🛍️ Application Received!</h1><p>MultiVendor Seller Program</p></div>
      <div class="body">
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Thank you for applying to become a vendor on <strong>MultiVendor</strong>! We have received your application.</p>
        <p><span class="badge">⏳ Under Review</span></p>
        <div class="steps">
          <p style="font-weight:600;color:#2d3748;margin:0 0 10px">What happens next?</p>
          <ol class="steps">
            <li>Our team will review your application within <strong>2–3 business days</strong></li>
            <li>You will receive an email with the decision</li>
            <li>Once approved, you can start listing your products immediately</li>
          </ol>
        </div>
        <p style="font-size:13px;color:#718096">Shop Name: <strong>${user.vendorInfo.shopName}</strong></p>
      </div>
      <div class="footer"><p>© ${new Date().getFullYear()} MultiVendor. All rights reserved.</p></div>
    </div></body></html>`;

  await sendEmail({ to: user.email, subject: "Vendor Application Received — MultiVendor", html });
};

// ════════════════════════════════════════════════════════
// Vendor Approved
// ════════════════════════════════════════════════════════
const sendVendorApprovedEmail = async (user, loginUrl) => {
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#276749,#38a169);padding:40px 30px;text-align:center}
      .hdr h1{color:#fff;margin:0;font-size:26px} .hdr p{color:#c6f6d5;margin:8px 0 0;font-size:14px}
      .body{padding:40px 30px} .body p{color:#4a5568;line-height:1.7;font-size:15px}
      .btn{display:inline-block;background:linear-gradient(135deg,#38a169,#276749);color:#fff!important;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:20px 0}
      .checklist{background:#f0fff4;border-left:4px solid #38a169;padding:16px 20px;border-radius:4px;margin:20px 0}
      .checklist li{color:#276749;margin:6px 0;font-size:14px}
      .footer{background:#f7fafc;padding:20px 30px;text-align:center}
      .footer p{color:#a0aec0;font-size:12px;margin:0}
    </style></head><body>
    <div class="wrap">
      <div class="hdr"><h1>🎉 Congratulations!</h1><p>Your vendor account is approved</p></div>
      <div class="body">
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Great news! Your vendor application for <strong>${user.vendorInfo.shopName}</strong> has been <strong style="color:#276749">approved</strong>. You can now start selling on MultiVendor!</p>
        <div class="checklist">
          <p style="font-weight:600;color:#276749;margin:0 0 10px">🚀 Get started:</p>
          <ul class="checklist">
            <li>Login to your vendor dashboard</li>
            <li>Complete your shop profile</li>
            <li>Add your first product</li>
            <li>Start receiving orders!</li>
          </ul>
        </div>
        <div style="text-align:center">
          <a href="${loginUrl}" class="btn">Go to Vendor Dashboard →</a>
        </div>
      </div>
      <div class="footer"><p>© ${new Date().getFullYear()} MultiVendor. All rights reserved.</p></div>
    </div></body></html>`;

  await sendEmail({ to: user.email, subject: "🎉 Your Vendor Account is Approved — MultiVendor", html });
};

// ════════════════════════════════════════════════════════
// Vendor Rejected
// ════════════════════════════════════════════════════════
const sendVendorRejectedEmail = async (user, reason) => {
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#742a2a,#c53030);padding:40px 30px;text-align:center}
      .hdr h1{color:#fff;margin:0;font-size:26px} .hdr p{color:#fed7d7;margin:8px 0 0;font-size:14px}
      .body{padding:40px 30px} .body p{color:#4a5568;line-height:1.7;font-size:15px}
      .reason{background:#fff5f5;border-left:4px solid #fc8181;padding:16px 20px;border-radius:4px;margin:20px 0}
      .reason p{color:#c53030;margin:0;font-size:14px}
      .btn{display:inline-block;background:#2d3748;color:#fff!important;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:20px 0}
      .footer{background:#f7fafc;padding:20px 30px;text-align:center}
      .footer p{color:#a0aec0;font-size:12px;margin:0}
    </style></head><body>
    <div class="wrap">
      <div class="hdr"><h1>Application Update</h1><p>Vendor application decision</p></div>
      <div class="body">
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>We have reviewed your vendor application for <strong>${user.vendorInfo.shopName}</strong> and unfortunately we are unable to approve it at this time.</p>
        <div class="reason">
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>You are welcome to re-apply after addressing the above issue. If you believe this is a mistake, please contact our support team.</p>
        <div style="text-align:center">
          <a href="${process.env.CLIENT_URL}/contact" class="btn">Contact Support</a>
        </div>
      </div>
      <div class="footer"><p>© ${new Date().getFullYear()} MultiVendor. All rights reserved.</p></div>
    </div></body></html>`;

  await sendEmail({ to: user.email, subject: "Vendor Application Update — MultiVendor", html });
};

// ════════════════════════════════════════════════════════
// Vendor Suspended
// ════════════════════════════════════════════════════════
const sendVendorSuspendedEmail = async (user, reason) => {
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#744210,#c05621);padding:40px 30px;text-align:center}
      .hdr h1{color:#fff;margin:0;font-size:26px}
      .body{padding:40px 30px} .body p{color:#4a5568;line-height:1.7;font-size:15px}
      .reason{background:#fffaf0;border-left:4px solid #ed8936;padding:16px 20px;border-radius:4px;margin:20px 0}
      .footer{background:#f7fafc;padding:20px 30px;text-align:center}
      .footer p{color:#a0aec0;font-size:12px;margin:0}
    </style></head><body>
    <div class="wrap">
      <div class="hdr"><h1>⚠️ Account Suspended</h1></div>
      <div class="body">
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your vendor account for <strong>${user.vendorInfo.shopName}</strong> has been temporarily suspended.</p>
        <div class="reason"><p><strong>Reason:</strong> ${reason}</p></div>
        <p>Please contact our support team to resolve this issue.</p>
        <p><a href="${process.env.CLIENT_URL}/contact" style="color:#667eea">Contact Support →</a></p>
      </div>
      <div class="footer"><p>© ${new Date().getFullYear()} MultiVendor. All rights reserved.</p></div>
    </div></body></html>`;

  await sendEmail({ to: user.email, subject: "⚠️ Vendor Account Suspended — MultiVendor", html });
};

module.exports = {
  sendVendorApplicationEmail,
  sendVendorApprovedEmail,
  sendVendorRejectedEmail,
  sendVendorSuspendedEmail,
};