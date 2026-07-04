import nodemailer from 'nodemailer';

// Configure SMTP transporter
// If you want to configure real email delivery, define these in backend/.env:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
const createTransporter = () => {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

export const sendLoginNotification = async (fullName, email) => {
  const targetEmail = 'saumitbehera07@gmail.com';
  const subject = `User Login Notification: ${fullName} has logged in`;
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px;">
      <h2 style="color: #2563EB; margin-top: 0;">SmartExpense Security Alert</h2>
      <p style="font-size: 14px;">An account login has been registered on the platform.</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 15px 0;" />
      <p><b>User Name:</b> ${fullName}</p>
      <p><b>User Email:</b> ${email}</p>
      <p><b>Login Time:</b> ${new Date().toLocaleString()}</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 15px 0;" />
      <span style="font-size: 10px; color: #94a3b8;">This is an automated security log dispatched by the AI-Based Expense Prediction System.</span>
    </div>
  `;

  const transporter = createTransporter();

  if (transporter) {
    try {
      const from = process.env.SMTP_FROM || '"SmartExpense System" <noreply@smartexpense.com>';
      await transporter.sendMail({
        from,
        to: targetEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[EMAIL] Login alert sent to ${targetEmail} for user ${email}`);
    } catch (err) {
      console.error('[EMAIL] Failed to send SMTP notification:', err);
    }
  } else {
    // Simulator Console fallback
    console.log(`=================================================`);
    console.log(`[SIMULATED EMAIL NOTIFICATION]`);
    console.log(`TO: ${targetEmail}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: User ${fullName} (${email}) logged in at ${new Date().toLocaleString()}`);
    console.log(`(Configure SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env for real delivery)`);
    console.log(`=================================================`);
  }
};
