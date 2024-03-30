// controllers/loginController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');

async function loginUser(req, res) {
  const { email, password, redirect } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render("login", {
        errorMessage: "Invalid email or password.",
        userFirstName: "",
        isLoggedIn: false,
        redirect: redirect,
      });
    }

    req.session.userId = user._id;
    req.session.userFirstName = user.firstName;

    res.redirect(redirect || '/home');
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).render("login", {
      errorMessage: "An error occurred during login. Please try again.",
      userFirstName: "",
      isLoggedIn: false,
      redirect: redirect,
    });
  }
}

module.exports = { loginUser };
