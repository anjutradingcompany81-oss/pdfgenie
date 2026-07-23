import nodemailer from "nodemailer";

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.warn(
      `[email] SMTP is not configured — would have sent a password reset link to ${to}: ${resetUrl}`
    );
    return false;
  }

  const from = process.env.SMTP_FROM || "PDF Genie <no-reply@pdfgenie.in>";

  await transport.sendMail({
    from,
    to,
    subject: "Reset your PDF Genie password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `
      <p>Someone requested a password reset for your PDF Genie account.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });

  return true;
}
