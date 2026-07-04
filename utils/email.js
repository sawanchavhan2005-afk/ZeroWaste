import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  const isMailConfigured =
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS;

  if (isMailConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '2525', 10),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const message = {
        from: process.env.EMAIL_FROM || 'ZeroWaste Platform <noreply@zerowaste.org>',
        to: options.email,
        subject: options.subject,
        html: options.html,
      };

      const info = await transporter.sendMail(message);
      console.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('SMTP Email Error:', error.message);
    }
  }

  // Fallback: Log to terminal
  console.log('\n======================================================');
  console.log('📬 [EMAIL SIMULATOR]');
  console.log(`TO:      ${options.email}`);
  console.log(`SUBJECT: ${options.subject}`);
  console.log('------------------------------------------------------');
  console.log(options.html.replace(/<[^>]*>/g, ' ').trim().replace(/\s+/g, ' '));
  console.log('======================================================\n');
  return true;
};
