const nodemailer = require('nodemailer');

// Only set up the mailer if all required env vars are present —
// so registration never breaks even if email isn't configured yet.
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function notifyAdminNewRegistration(mandal) {
  if (!transporter || !process.env.ADMIN_EMAIL) {
    console.log('Email notification skipped — GMAIL_USER/GMAIL_APP_PASSWORD/ADMIN_EMAIL not set');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"GaneshMandalPro" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Naya mandal register zala: ${mandal.name}`,
      text:
        `Mandal cha naav: ${mandal.name}\n` +
        `Address: ${mandal.address || '-'}\n` +
        `Mobile: ${mandal.mobile || '-'}\n` +
        `Username: ${mandal.username}\n\n` +
        `Payment confirm zalyavar admin panel madhe jaun approve kar:\n` +
        `https://ganeshmandalpro.onrender.com/admin.html`
    });
  } catch (err) {
    // Never let an email failure break registration
    console.error('Admin email notification failed:', err.message);
  }
}

module.exports = { notifyAdminNewRegistration };