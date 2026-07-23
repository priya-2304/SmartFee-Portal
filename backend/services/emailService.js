// const nodemailer = require('nodemailer');

// let transporter;

// const getTransporter = () => {
//   if (!transporter) {
//     transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: Number(process.env.SMTP_PORT) || 587,
//       secure: Number(process.env.SMTP_PORT) === 465,
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     transporter.verify((err, success) => {
//       if (err) {
//         console.error("SMTP verify failed:", err);
//       } else {
//         console.log("SMTP server is ready");
//       }
//     });
//   }

//   return transporter;
// };

// const sendEmail = async ({ to, subject, html, attachments }) => {
//   if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
//     console.log(`[emailService] SMTP not configured. Would send to ${to}: ${subject}`);
//     return { skipped: true };
//   }

//   const mailOptions = {
//     from: process.env.SMTP_FROM || process.env.SMTP_USER,
//     to,
//     subject,
//     html,
//     attachments,
//   };

//   // return getTransporter().sendMail(mailOptions);
//   const smtp = await getTransporter();
// return smtp.sendMail(mailOptions);
// };

// const sendOtpEmail = (to, otp) =>
//   sendEmail({
//     to,
//     subject: 'Geeta University - Password Reset OTP',
//     html: `<p>Your OTP for password reset is <b>${otp}</b>. It is valid for 15 minutes.</p>
//            <p>If you did not request this, please ignore this email.</p>`,
//   });

//   const sendRegistrationOtpEmail = (to, otp) =>
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
    subject: 'Geeta University - Password Reset OTP',
    html: `<p>Your OTP for password reset is <b>${otp}</b>. It is valid for 15 minutes.</p>
           <p>If you did not request this, please ignore this email.</p>`,
  });

const sendRegistrationOtpEmail = (to, otp) =>
  sendEmail({
    to,
    subject: 'Geeta University - Email Verification OTP',
    html: `<p>Your OTP for email verification is <b>${otp}</b>. It is valid for 10 minutes.</p>
           <p>If you did not request this, please ignore this email.</p>`,
  });

const sendDueReminderEmail = (to, name, amount, dueDate, daysLeft) =>
  sendEmail({
    to,
    subject: `Fee Due Reminder - ${daysLeft} day(s) left`,
    html: `<p>Dear ${name},</p>
           <p>This is a reminder that you have a pending fee balance of <b>₹${amount}</b> due on
           <b>${new Date(dueDate).toDateString()}</b> (${daysLeft} day(s) remaining).</p>
           <p>Please log in to the Geeta University fee portal to complete your payment.</p>`,
  });

const sendPaymentSuccessEmail = (to, name, amount, receiptUrl) =>
  sendEmail({
    to,
    subject: 'Payment Successful - Geeta University',
    html: `<p>Dear ${name},</p>
           <p>We have received your payment of <b>₹${amount}</b>. Your receipt is attached / available
           ${receiptUrl ? `at: ${receiptUrl}` : 'on the portal'}.</p>`,
  });

module.exports = { sendEmail, sendOtpEmail, sendRegistrationOtpEmail, sendDueReminderEmail, sendPaymentSuccessEmail };