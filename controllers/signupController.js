// controllers/signupController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');

async function signupUser(req, res) {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).send("Please fill in all the fields.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      no_reviews: 0,
      no_ratings: 0,
    };
    
    const savedUser = await User.create(newUser);
    console.log("User saved successfully:", savedUser);
    res.status(200).send("User created");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error signing up user.");
  }
}

module.exports = { signupUser };
