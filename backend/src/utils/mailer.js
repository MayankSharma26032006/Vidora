import nodemailer from "nodemailer";

// Lightweight mail helper. If SMTP env vars are configured the mail is sent
// through nodemailer; otherwise (local/dev/test) the email is logged to the
// console so flows that depend on it (verify/reset links) stay usable without
// a real provider. Auth endpoints never hard-fail on mailer errors.

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * @param {Object} opts
 * @param {string} opts.to       recipient address
 * @param {string} opts.subject  email subject
 * @param {string} opts.text     plain text body
 * @param {string} [opts.html]   optional html body
 */
export async function sendMail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[mailer:dev] To: ${to} | Subject: ${subject}`);
    console.log(text || "");
    return;
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}
