const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { otpStore } = require('./sendOtpController');

async function setPassword(req, res) {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  if (!otpStore[email]) {
    res.status(400).json({ error: "OTP verification required" });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const { firstName, lastName } = otpStore[email];
    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      no_reviews: 0,
      no_ratings: 0,
    });

    delete otpStore[email];

    res.json({ message: "Signup complete. You can now log in." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating user account" });
  }
}

module.exports = { setPassword };
