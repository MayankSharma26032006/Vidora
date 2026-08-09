import nodemailer from "nodemailer";






let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    console.log(
      `[mailer] SMTP configured host=${process.env.SMTP_HOST} port=${Number(process.env.SMTP_PORT) || 587} secure=${process.env.SMTP_SECURE === "true"} user=${process.env.SMTP_USER}`
    );
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}


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
