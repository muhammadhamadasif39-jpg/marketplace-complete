const nodemailer = require("nodemailer");

// Creates a reusable transporter using SMTP credentials from .env.
// Works with Gmail (with an App Password), Mailtrap (for testing), SendGrid SMTP, etc.
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Sends an email. If SMTP is not configured (common during local dev),
// it logs the email to the console instead of throwing - so the rest of
// the app keeps working even before you've set up a mail provider.
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log("\n📧 [DEV MODE] SMTP not configured. Email would have been sent:");
    console.log(`To: ${to}\nSubject: ${subject}\n${html}\n`);
    return { devMode: true };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"Marketplace" <no-reply@marketplace.com>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
