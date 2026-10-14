let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('[EmailService] Optional nodemailer module not found, using internal stream fallback');
}

let transporter = null;

// Initialize email transporter
const initTransporter = async () => {
  if (transporter) return transporter;

  if (nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[EmailService] Configured custom SMTP transporter for:', process.env.SMTP_HOST);
  } else if (nodemailer) {
    // Development fallback transporter
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
      buffer: true
    });
    console.log('[EmailService] Using internal email stream dispatcher');
  } else {
    // Minimal mock transporter if nodemailer package is not present
    transporter = {
      sendMail: async (options) => {
        return { messageId: `msg_${Date.now()}` };
      }
    };
    console.log('[EmailService] Using virtual email dispatcher');
  }

  return transporter;
};

const sendRegistrationOtp = async (toEmail, name, otp) => {
  const mailer = await initTransporter();
  const subject = 'EcoDonate — Verify Your Email Address';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; rounded: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #16a34a; margin: 0; font-size: 26px;">🌱 EcoDonate</h2>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Give Waste a Second Life</p>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <p style="font-size: 15px; color: #1f2937; margin: 0 0 12px 0;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0;">
          Thank you for registering on EcoDonate. To complete your registration and send your application for administrator review, please verify your email address using the one-time verification code below:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; padding: 14px 28px; background-color: #16a34a; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 6px; border-radius: 10px;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
          This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
      </div>

      <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
        <p style="margin: 0 0 8px 0;"><strong>What happens next?</strong></p>
        <p style="margin: 0;">Once your email is verified, your account will enter the <strong>Pending Approval</strong> state. Our administrator will review your application and approve your account for full platform access.</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
        © 2026 EcoDonate Foundation. If you did not create an account, please ignore this email.
      </p>
    </div>
  `;

  const textContent = `EcoDonate Registration Verification Code: ${otp}\n\nHello ${name},\nUse this 6-digit code to verify your email address on EcoDonate. This code is valid for 10 minutes.\n\nOnce verified, your account will be submitted for Admin approval.`;

  try {
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"EcoDonate Platform" <noreply@ecodonate.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    console.log('\n================================================================');
    console.log('🌱 [ECODONATE EMAIL SERVICE] REGISTRATION VERIFICATION CODE');
    console.log('================================================================');
    console.log(`👤 Recipient Email : ${toEmail}`);
    console.log(`👤 Recipient Name  : ${name}`);
    console.log(`🔑 VERIFICATION CODE: >>> [ ${otp} ] <<<`);
    console.log(`⏱️  Code Expiry     : 10 Minutes`);
    if (!hasSmtpConfig) {
      console.log('⚠️  DELIVERY STATUS : In-Memory Stream Fallback (No SMTP configured)');
      console.log(`💡 DEV TIP         : Enter code [ ${otp} ] on the registration screen.`);
      console.log('                      To send real emails to your Gmail/inbox, add SMTP');
      console.log('                      credentials to backend/.env (see backend/.env.example)');
    } else {
      console.log(`🚀 Delivery Route  : Outgoing SMTP (${process.env.SMTP_HOST})`);
    }
    console.log('================================================================\n');

    return { success: true, messageId: info.messageId, otp };
  } catch (error) {
    console.error('[EmailService] Error sending registration OTP:', error.message);
    console.log(`📧 [EMAIL SERVICE] Fallback stream dispatch to ${toEmail}`);
    console.log(`🔑 FALLBACK VERIFICATION CODE: >>> [ ${otp} ] <<<`);
    return { success: true, fallback: true, otp };
  }
};

const sendPasswordResetOtp = async (toEmail, name, otp, resetLink) => {
  const mailer = await initTransporter();
  const subject = 'EcoDonate — Reset Your Password';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #15803d, #16a34a); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">🌱 EcoDonate</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Account Security & Recovery</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 28px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0;">Password Reset Request</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
            Hello <strong>${name || 'EcoDonate Member'}</strong>,<br/>
            We received a request to reset your password for your EcoDonate account. You can reset your password using the secure button below:
          </p>

          ${resetLink ? `
          <!-- Primary CTA Button: Direct Reset Link -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 3px 6px rgba(22, 163, 74, 0.3);">
              Reset My Password
            </a>
            <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
              Link valid for 30 minutes. If the button doesn't work, copy and paste this URL into your browser:<br/>
              <span style="font-family: monospace; color: #0284c7; word-break: break-all; font-size: 11px;">${resetLink}</span>
            </p>
          </div>
          ` : ''}

          <!-- Secondary Option: 6-Digit Code -->
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <p style="font-size: 13px; color: #64748b; margin: 0 0 8px 0; font-weight: 600;">
              Or enter this 6-digit verification code in the reset prompt:
            </p>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', monospace; margin: 8px 0;">
              ${otp}
            </div>
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">Code valid for 15 minutes</p>
          </div>

          <!-- Security Notice -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px;">
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
              <strong>Didn't request this change?</strong> You can safely ignore this email — your password will remain unchanged. If you suspect unauthorized access, please contact our support team immediately.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            © 2026 EcoDonate Platform. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  const textContent = `EcoDonate — Password Reset Request\n\nHello ${name || 'EcoDonate Member'},\n\n` +
    `We received a request to reset your EcoDonate account password.\n\n` +
    (resetLink ? `To reset your password directly, visit:\n${resetLink}\n\n` : '') +
    `Or use this 6-digit verification code: ${otp}\n(Valid for 15 minutes)\n\n` +
    `If you did not request this reset, please ignore this email.`;

  try {
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"EcoDonate Security" <security@ecodonate.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    console.log('\n================================================================');
    console.log('🔐 [ECODONATE EMAIL SERVICE] PASSWORD RESET REQUEST DISPATCHED');
    console.log('================================================================');
    console.log(`👤 Recipient Email  : ${toEmail}`);
    console.log(`👤 Recipient Name   : ${name || 'User'}`);
    console.log(`🔑 6-Digit Code     : [ ${otp} ]`);
    if (resetLink) {
      console.log(`🔗 Direct Reset Link: ${resetLink}`);
    }
    console.log(`⏱️  Validity Period  : 15-30 Minutes`);
    if (!hasSmtpConfig) {
      console.log('⚠️  DELIVERY ROUTE  : Terminal Fallback (Configure SMTP in .env for real inbox delivery)');
    } else {
      console.log(`🚀 DELIVERY ROUTE  : Outgoing SMTP (${process.env.SMTP_HOST})`);
    }
    console.log('================================================================\n');

    return { success: true, messageId: info.messageId, otp, resetLink };
  } catch (error) {
    console.error('[EmailService] Error dispatching password reset email:', error.message);
    console.log(`🔑 FALLBACK CODE: [ ${otp} ]`);
    if (resetLink) {
      console.log(`🔗 FALLBACK LINK: ${resetLink}`);
    }
    return { success: true, fallback: true, otp, resetLink };
  }
};

module.exports = {
  sendRegistrationOtp,
  sendPasswordResetOtp
};
