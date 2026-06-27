const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  });
};

// ────────────────────────────────────────
// Generic send email function
// ────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

// ────────────────────────────────────────
// Email Verification Template
// ────────────────────────────────────────
const sendVerificationEmail = async (user, verifyUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
        .header p { color: #a0aec0; margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px 30px; }
        .body p { color: #4a5568; line-height: 1.7; font-size: 15px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0; }
        .footer { background: #f7fafc; padding: 20px 30px; text-align: center; }
        .footer p { color: #a0aec0; font-size: 12px; margin: 0; }
        .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛒 MultiVendor</h1>
          <p>Your marketplace, your rules</p>
        </div>
        <div class="body">
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Welcome aboard! Please verify your email address to activate your account and start shopping or selling.</p>
          <p>This link will expire in <strong>24 hours</strong>.</p>
          <div style="text-align: center;">
            <a href="${verifyUrl}" class="btn">✅ Verify Email Address</a>
          </div>
          <div class="divider"></div>
          <p style="font-size: 13px; color: #718096;">If you didn't create an account, you can safely ignore this email.</p>
          <p style="font-size: 13px; color: #718096;">Or copy this link: <br><span style="word-break: break-all; color: #667eea;">${verifyUrl}</span></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} MultiVendor. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: user.email, subject: "Verify Your Email — MultiVendor", html });
};

// ────────────────────────────────────────
// Password Reset Email Template
// ────────────────────────────────────────
const sendPasswordResetEmail = async (user, resetUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; }
        .body { padding: 40px 30px; }
        .body p { color: #4a5568; line-height: 1.7; font-size: 15px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0; }
        .warning { background: #fff5f5; border-left: 4px solid #fc8181; padding: 16px; border-radius: 4px; margin: 20px 0; }
        .warning p { color: #c53030; margin: 0; font-size: 13px; }
        .footer { background: #f7fafc; padding: 20px 30px; text-align: center; }
        .footer p { color: #a0aec0; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
        </div>
        <div class="body">
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to proceed.</p>
          <div class="warning">
            <p>⚠️ This link expires in <strong>15 minutes</strong>. If you didn't request this, please ignore this email.</p>
          </div>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">🔑 Reset My Password</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} MultiVendor. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: user.email, subject: "Password Reset Request — MultiVendor", html });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };