const crypto = require('crypto');
const nodemailer = require('nodemailer');

let otpStore = {}; // Store OTP in memory

async function sendOtp(req, res) {
  const { email, firstName, lastName } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

  otpStore[email] = { otp, otpExpires, firstName, lastName };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Your OTP",
      text: `Your OTP is: ${otp}`,
    });
    res.json({ message: "OTP sent to " + email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error sending OTP" });
  }
}

module.exports = { sendOtp, otpStore };
