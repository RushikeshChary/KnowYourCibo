require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");
const session = require("express-session");
const Item = require("./models/item.js");
const User = require("./models/user.js");

var otpStore = {}; // Declaration of otpStore

// const userSchema = new mongoose.Schema({
//   firstName: String,
//   lastName: String,
//   email: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
// });
// const User = mongoose.model('User', userSchema);

const app = express();

const Port = process.env.PORT || 3000;
// connect to mongodb & listen for requests
const dbURI1 =
  "mongodb+srv://rushi:rushi@cluster.8ailuyg.mongodb.net/Food-items?retryWrites=true&w=majority&appName=Cluster";

mongoose
  .connect(dbURI1)
  .then((result) =>
    app.listen(Port, () => {
      console.log("Database connection established");
      console.log(`Server is running at http://localhost:${Port}`);
    })
  )
  .catch((err) => console.log(err));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: "auto", httpOnly: true },
    // store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.userId ? true : false;
  res.locals.userFirstName = req.session.userFirstName || "";
  next();
});

function checkLogin(req, res, next) {
  if (req.session.userId && req.session) {
    next();
  } else {
    // res.redirect("/login");
    res.send("You cannot access this page");
  }
}

//mail settings for sending otp.
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

//Database check to add items to database.
app.get("/check", (req, res) => {
  const user = new User({
    firstName: "Bhavana",
    lastName: "Denchanadula",
    email: "bhavana19@gmail.com",
    password: "bhanu",
    no_reviews: 0,
    no_ratings: 0,
    fav_items: ["65e8718f585fbfb2a6af90a3", "65e86f1d70a3f056073e13a3"],
  });
  user
    .save()
    .then((result) => {
      res.send(result);
    })
    .catch((err) => console.error(err));
});

//Authentication routing.
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Sign-up Route
app.post("/check-user", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      res.json({ exists: true, message: "User already exists." });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error checking user existence." });
  }
});
// app.get('/login', (req, res) => {
//   res.render('login', { errorMessage: '' });
// });

app.get("/login", async (req, res) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        // If user is found, pass user data to the template
        res.render("login", {
          userFirstName: user.firstName,
          isLoggedIn: true,
          errorMessage: "",
        });
      } else {
        // If user is not found, still render the login page but with default values
        res.render("login", {
          userFirstName: "",
          isLoggedIn: false,
          errorMessage: "",
        });
      }
    } else {
      // If there is no session, render the login page with default values
      res.render("login", {
        userFirstName: "",
        isLoggedIn: false,
        errorMessage: "",
      });
    }
  } catch (error) {
    console.error("Error fetching user", error);
    res.render("login", {
      userFirstName: "",
      isLoggedIn: false,
      errorMessage: "An error occurred. Please try again.",
    });
  }
});

app.post("/send-otp", async (req, res) => {
  const { email, firstName, lastName } = req.body; // Capture firstName and lastName for later user creation
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  // Store OTP and email expiration in memory
  otpStore[email] = { otp, otpExpires, firstName, lastName };

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
});

app.post("/verify-otp", async (req, res) => {
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
});

//password setter.
app.post("/set-password", async (req, res) => {
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
    // Create user with data from otpStore and the hashed password
    const { firstName, lastName } = otpStore[email];
    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // Clean up OTP store
    delete otpStore[email];

    res.json({ message: "Signup complete. You can now log in." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating user account" });
  }
});
app.post("/signup", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  console.log(req.body);
  // Check if all fields are provided
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).send("Please fill in all the fields.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(firstName, lastName);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    newUser
      .save()
      .then((savedUser) => {
        console.log("User saved successfully:", savedUser);
      })
      .catch((error) => {
        if (error.name === "ValidationError") {
          console.error("Validation error:", error.message);
        } else {
          console.error("Error saving user:", error);
        }
      });

    // Redirect or handle post-signup logic here
    // res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send("Error signing up user.");
  }
});
//Later, change this /dashboard to /home.
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Normalize email to lowercase before lookup to ensure case-insensitive match
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // If user is found, compare provided password with hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        // Passwords match, set user information in session
        req.session.userId = user._id; // Assuming 'user' is your user object from the database
        req.session.userFirstName = user.firstName; // Ensure this matches the field name in your user model

        // Redirect to the home page
        return res.redirect("/home");
      } else {
        // Passwords do not match, render login page with error
        return res.render("login", {
          errorMessage: "Invalid email or password.",
          userFirstName: "",
          isLoggedIn: false,
        });
      }
    } else {
      // No user found with the provided email, render login page with error
      return res.render("login", {
        errorMessage: "Invalid email or password.",
        userFirstName: "",
        isLoggedIn: false,
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.render("login", {
      errorMessage: "An error occurred during login. Please try again.",
      userFirstName: "",
      isLoggedIn: false,
    });
  }
});
app.get("/dashboard", checkLogin, (req, res) => {
  res.send("Welcome to your Dashboard!");
});

app.get("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.error("Session destruction error", err);
    }
    res.redirect("/home");
  });
});
//Authentication ends here.

//Genereal routing starts from here.
app.get("/", (req, res) => {
  res.redirect("home");
});

app.get("/home", async (req, res) => {
  let userFirstName = "";
  let isLoggedIn = false;

  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      userFirstName = user.firstName;
      isLoggedIn = true;
    } catch (error) {
      console.error("Error fetching user for home page", error);
    }
  }

  res.render("home", {
    isLoggedIn,
    userFirstName,
  });
});

app.get("/searchPage", (req, res) => {
  res.render("searchPage", { items: [] });
});

app.post("/searchPage", async (req, res) => {
  const search = req.body.search;
  if (search.length > 0) {
    var regexPattern = new RegExp(search, "i");
    await Item.find({
      $or: [
        { name: { $regex: regexPattern } },
        { hall: search },
        { category: search },
      ],
    })
      .then((result) => {
        res.render("searchPage", { items: result });
      })
      .catch((err) => console.error(err));
  } else {
    res.render("searchPage", { items: [] });
  }
  console.log(req.body);
});

// Hall page route
app.get("/hall-2", (req, res) => {
  res.render("hall-2");
});

// Profile page route
app.get("/profile",checkLogin, async (req, res) => {
  const id = req.session.userId;
  // const id = "65eadd97673a7bf0caf2dc26";
  await User.findById({ _id: id }).then(async (result) => {
    const favArray = result.fav_items;
    if (favArray.length > 0) {
      await Item.find({ _id: { $in: favArray } }).then((foundItems) => {
        // console.log('Found items:', foundItems);
        res.render("profile", { info: result, items: foundItems });
      });
    } else {
      res.render("profile", { info: result, items: [] });
    }
    // console.log(result);
  });
});

//edit profile page route
app.get("/editProfile",checkLogin, (req, res) => {
  res.render("editProfile");
});

app.post("/check-editProfile", async (req, res) => {
  const userId = req.session.userId;
  // const userId = "65eadd97673a7bf0caf2dc26";
  const { firstName, lastName, password, newpassword } = req.body;
  var updatedDetails = {};
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ message: "Incorrect password!! Enter correct password to update details" });
    }

    const newhashedPassword = await bcrypt.hash(newpassword, 10);

    updatedDetails = {
      firstName: firstName,
      lastName: lastName,
      password: newhashedPassword,
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedDetails },
      { new: true }
    );

    // console.log("User details updated successfully:", updatedUser);
    return res.json({ message: "Updated details successfully" });
  } catch (err) {
    console.error(err);
    return res.json({ error: "Some error occurred in editing profile!! Try again." });
  }
});