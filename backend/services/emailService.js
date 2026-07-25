// const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// const parseFromHeader = (fromHeader) => {
//   const match = fromHeader?.match(/^(.*)<(.+)>$/);
//   if (match) {
//     return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
//   }
//   return { name: 'SmartFee Portal', email: fromHeader };
// };

// const sendEmail = async ({ to, subject, html, attachments }) => {
//   if (!process.env.BREVO_API_KEY) {
//     console.log(`[emailService] BREVO_API_KEY not configured. Would send to ${to}: ${subject}`);
//     return { skipped: true };
//   }

//   const sender = parseFromHeader(process.env.SMTP_FROM || process.env.SMTP_USER);

//   const payload = {
//     sender,
//     to: [{ email: to }],
//     subject,
//     htmlContent: html,
//   };

//   if (attachments?.length) {
//     payload.attachment = attachments.map((a) => ({
//       name: a.filename,
//       content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
//     }));
//   }

//   const res = await fetch(BREVO_API_URL, {
//     method: 'POST',
//     headers: {
//       'api-key': process.env.BREVO_API_KEY,
//       'Content-Type': 'application/json',
//       Accept: 'application/json',
//     },
//     body: JSON.stringify(payload),
//   });

//   if (!res.ok) {
//     const errBody = await res.text().catch(() => '');
//     throw new Error(`Brevo email send failed (${res.status}): ${errBody}`);
//   }

//   return res.json();
// };

// const sendOtpEmail = (to, otp) =>
//   sendEmail({
//     to,
//     subject: 'Geeta University - Password Reset OTP',
//     html: `<p>Your OTP for password reset is <b>${otp}</b>. It is valid for 15 minutes.</p>
//            <p>If you did not request this, please ignore this email.</p>`,
//   });

// const sendRegistrationOtpEmail = (to, otp) =>
//   sendEmail({
//     to,
//     subject: 'Geeta University - Email Verification OTP',
//     html: `<p>Your OTP for email verification is <b>${otp}</b>. It is valid for 10 minutes.</p>
//            <p>If you did not request this, please ignore this email.</p>`,
//   });

// const sendDueReminderEmail = (to, name, amount, dueDate, daysLeft) =>
//   sendEmail({
//     to,
//     subject: `Fee Due Reminder - ${daysLeft} day(s) left`,
//     html: `<p>Dear ${name},</p>
//            <p>This is a reminder that you have a pending fee balance of <b>₹${amount}</b> due on
//            <b>${new Date(dueDate).toDateString()}</b> (${daysLeft} day(s) remaining).</p>
//            <p>Please log in to the Geeta University fee portal to complete your payment.</p>`,
//   });

// const sendPaymentSuccessEmail = (to, name, amount, receiptUrl) =>
//   sendEmail({
//     to,
//     subject: 'Payment Successful - Geeta University',
//     html: `<p>Dear ${name},</p>
//            <p>We have received your payment of <b>₹${amount}</b>. Your receipt is attached / available
//            ${receiptUrl ? `at: ${receiptUrl}` : 'on the portal'}.</p>`,
//   });

// module.exports = { sendEmail, sendOtpEmail, sendRegistrationOtpEmail, sendDueReminderEmail, sendPaymentSuccessEmail };




const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const APP_NAME = process.env.UNIVERSITY_NAME || 'SmartFee Portal';
const PORTAL_URL = process.env.CLIENT_URL || '#';

const wrapEmail = (title, bodyHtml) => `
<div style="margin:0;padding:24px 16px;background-color:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(15,23,42,0.08);">
    <div style="background:linear-gradient(135deg,#4f46e5,#4338ca);padding:22px 28px;">
      <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">${APP_NAME}</p>
    </div>
    <div style="padding:28px;">
      <h2 style="margin:0 0 16px;color:#0f172a;font-size:19px;">${title}</h2>
      <div style="color:#334155;font-size:14.5px;line-height:1.65;">${bodyHtml}</div>
    </div>
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated message from ${APP_NAME}. Please do not reply to this email.</p>
    </div>
  </div>
</div>`;

const otpBox = (otp) => `
  <div style="margin:20px 0;text-align:center;background:#eef2ff;border:1px dashed #6366f1;border-radius:10px;padding:18px;">
    <p style="margin:0 0 6px;color:#4338ca;font-size:12px;font-weight:600;letter-spacing:1px;">YOUR OTP</p>
    <p style="margin:0;color:#312e81;font-size:32px;font-weight:800;letter-spacing:8px;">${otp}</p>
  </div>`;

const ctaButton = (label, href = PORTAL_URL) => `
  <div style="margin-top:22px;">
    <a href="${href}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:8px;">${label}</a>
  </div>`;

const parseFromHeader = (fromHeader) => {
  const match = fromHeader?.match(/^(.*)<(.+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
  }
  return { name: 'SmartFee Portal', email: fromHeader };
};

const sendEmail = async ({ to, subject, html, attachments }) => {
  if (!process.env.BREVO_API_KEY) {
    console.log(`[emailService] BREVO_API_KEY not configured. Would send to ${to}: ${subject}`);
    return { skipped: true };
  }

  const sender = parseFromHeader(process.env.SMTP_FROM || process.env.SMTP_USER);

  const payload = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (attachments?.length) {
    payload.attachment = attachments.map((a) => ({
      name: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
    }));
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Brevo email send failed (${res.status}): ${errBody}`);
  }

  return res.json();
};

const sendOtpEmail = (to, otp) =>
  sendEmail({
    to,
    subject: `${APP_NAME} - Password Reset OTP`,
    html: wrapEmail(
      'Reset your password',
      `<p style="margin:0;">We received a request to reset your password. Use the OTP below to continue — it's valid for <b>15 minutes</b>.</p>
       ${otpBox(otp)}
       <p style="margin:0;color:#94a3b8;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>`
    ),
  });

const sendRegistrationOtpEmail = (to, otp) =>
  sendEmail({
    to,
    subject: `${APP_NAME} - Email Verification OTP`,
    html: wrapEmail(
      'Verify your email',
      `<p style="margin:0;">Welcome! Use the OTP below to verify your email address and complete your registration — it's valid for <b>10 minutes</b>.</p>
       ${otpBox(otp)}
       <p style="margin:0;color:#94a3b8;font-size:13px;">If you didn't request this, please ignore this email.</p>`
    ),
  });

const sendDueReminderEmail = (to, name, amount, dueDate, daysLeft) =>
  sendEmail({
    to,
    subject: `Fee Due Reminder - ${daysLeft} day(s) left`,
    html: wrapEmail(
      'Your fee payment is due soon',
      `<p style="margin:0;">Dear ${name},</p>
       <p style="margin:10px 0 0;">This is a reminder that you have a pending fee balance. Please clear it before the due date to avoid late charges.</p>
       <div style="margin:20px 0;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 18px;">
         <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
           <span style="color:#9a3412;font-size:13px;">Amount Due</span>
           <span style="color:#9a3412;font-size:16px;font-weight:700;">₹${amount.toLocaleString()}</span>
         </div>
         <div style="display:flex;justify-content:space-between;">
           <span style="color:#9a3412;font-size:13px;">Due Date</span>
           <span style="color:#9a3412;font-size:13px;font-weight:600;">${new Date(dueDate).toDateString()} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)</span>
         </div>
       </div>
       ${ctaButton('Pay Now →')}`
    ),
  });

const sendPaymentSuccessEmail = (to, name, amount, receiptUrl) =>
  sendEmail({
    to,
    subject: `Payment Successful - ${APP_NAME}`,
    html: wrapEmail(
      'Payment received ✅',
      `<p style="margin:0;">Dear ${name},</p>
       <p style="margin:10px 0 0;">We've successfully received your payment. Thank you!</p>
       <div style="margin:20px 0;text-align:center;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px;">
         <p style="margin:0 0 4px;color:#15803d;font-size:12px;font-weight:600;letter-spacing:.5px;">AMOUNT PAID</p>
         <p style="margin:0;color:#166534;font-size:28px;font-weight:800;">₹${amount.toLocaleString()}</p>
       </div>
       ${receiptUrl ? ctaButton('Download Receipt', receiptUrl) : `<p style="margin:0;color:#94a3b8;font-size:13px;">Your receipt is available on the portal under Payment History.</p>`}`
    ),
  });

module.exports = { sendEmail, sendOtpEmail, sendRegistrationOtpEmail, sendDueReminderEmail, sendPaymentSuccessEmail };