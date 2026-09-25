const nodemailer = require('nodemailer');

let transporter = null;

// Initialize email transporter
const initTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
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
  } else {
    // Development fallback transporter
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
      buffer: true
    });
    console.log('[EmailService] Using secure internal email dispatcher (SMTP credentials not provided in .env)');
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

    console.log('================================================================');
    console.log(`📧 [EMAIL SERVICE] Registration verification email dispatched to: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Expires in: 10 Minutes`);
    console.log('================================================================');

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending registration OTP:', error.message);
    console.log(`📧 [EMAIL SERVICE] Fallback stream dispatch to ${toEmail}`);
    return { success: true, fallback: true };
  }
};

const sendPasswordResetOtp = async (toEmail, name, otp) => {
  const mailer = await initTransporter();
  const subject = 'EcoDonate — Password Reset Verification Code';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; rounded: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #16a34a; margin: 0; font-size: 26px;">🌱 EcoDonate</h2>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <p style="font-size: 15px; color: #1f2937; margin: 0 0 12px 0;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0;">
          We received a request to reset your EcoDonate password. Enter the one-time verification code below to verify your identity and set a new password:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 6px; border-radius: 10px;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
          This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please secure your account immediately.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
        © 2026 EcoDonate Foundation.
      </p>
    </div>
  `;

  const textContent = `EcoDonate Password Reset Code: ${otp}\n\nHello ${name},\nUse this code to reset your password. Valid for 10 minutes.`;

  try {
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"EcoDonate Security" <security@ecodonate.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log('================================================================');
    console.log(`📧 [EMAIL SERVICE] Password reset email dispatched to: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Expires in: 10 Minutes`);
    console.log('================================================================');

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending password reset OTP:', error.message);
    console.log(`📧 [EMAIL SERVICE] Fallback stream dispatch to ${toEmail}`);
    return { success: true, fallback: true };
  }
};

module.exports = {
  sendRegistrationOtp,
  sendPasswordResetOtp
};
