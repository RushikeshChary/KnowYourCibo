const { otpStore } = require('./sendOtpController');

async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const otpData = otpStore[email];

  if (otpData && otpData.otp === otp && otpData.otpExpires > new Date()) {
    res.json({
      success: true,
      message: "OTP verified successfully. Please set your password.",
    });
  } else {
    res.status(400).json({ success: false, error: "Invalid or expired OTP" });
  }
}

module.exports = { verifyOtp };
