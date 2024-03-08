require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");
const session = require("express-session");
const Item = require("./models/item");
const User = require("./models/user");

var otp_global ;
var otp_expires ;

const app = express();

const Port = process.env.PORT || 3000;

// connect to mongodb & listen for requests
const dbURI1 = "mongodb+srv://rushi:rushi@cluster.8ailuyg.mongodb.net/Food-items?retryWrites=true&w=majority&appName=Cluster";

mongoose.connect(dbURI1)
  .then(result => app.listen(Port, () => {
    console.log('Database connection established');
    console.log(`Server is running at http://localhost:${Port}`);
  }))
  .catch(err => console.log(err));



app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: "auto", httpOnly: true },
  })
);

app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

app.use(express.json());


//Database check
// app.post('/check', (req, res) => {
//   const item = new Item({
//     name: 'Paneer kabab',
//     hall: 'Hall-2',
//     category: 'veg',
//     rating: 4,
//     price: 65
//   })
//   item.save()
//     .then((result) =>{
//       res.send(result);
//     })
//     .catch((err) =>console.error(err));

// })

//Authentication starts from here.

//Session check function.
function checkLogin(req, res, next) {
  if (req.session.userId && req.session) {
    next();
  } else {
    // res.redirect("/login");
    res.send("You cannot access this page")
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
app.get('/check', (req, res) => {
  const user = new User({
    firstName: 'Bhavana',
    lastName: 'Denchanadula',
    email: 'bhavana19@gmail.com',
    password: 'bhanu',
    no_reviews: 0,
    no_ratings: 0,
    fav_items: ['65e8718f585fbfb2a6af90a3','65e86f1d70a3f056073e13a3'],
  })
  user.save()
    .then((result) =>{
      res.send(result);
    })
    .catch((err) =>console.error(err));

})

//Authentication routing.
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Sign-up Route
app.post('/check-user', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      res.json({ exists: true, message: 'User already exists.' });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error checking user existence.' });
  }
});
// app.get('/login', (req, res) => {
//   res.render('login', { errorMessage: '' });
// });

app.get("/login", async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        // User is logged in, pass user's first name to the template
        res.render("login", {
          userFirstName: user.firstName,
          isLoggedIn: true,
          errorMessage: "",
        });
        return;
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  }
  // User is not logged in or an error occurred
  res.render("login", {
    userFirstName: "",
    isLoggedIn: false,
    errorMessage: "",
  });
});

app.post('/send-otp', async (req, res) => {
  const { email, firstName, lastName } = req.body; // Capture firstName and lastName for later user creation
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  // Store OTP and email expiration in memory
  otpStore[email] = { otp, otpExpires, firstName, lastName };

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your OTP',
      text: `Your OTP is: ${otp}`
    });
    res.json({ message: 'OTP sent to ' + email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error sending OTP' });
  }
});


app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const otpData = otpStore[email];

  if (otpData && otpData.otp === otp && otpData.otpExpires > new Date()) {
    res.json({ success: true, message: 'OTP verified successfully. Please set your password.' });
  } else {
    res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
  }
});
//password setter.
app.post('/set-password', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match' });
    return;
  }

  if (!otpStore[email]) {
    res.status(400).json({ error: 'OTP verification required' });
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

    res.json({ message: 'Signup complete. You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating user account' });
  }
});

//Later, change this /dashboard to /home.
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.render("login", { errorMessage: "Invalid email or password." });
    } else {
      req.session.userId = user._id;
      res.redirect("/dashboard");
    }
  } catch (error) {
    console.error(error);
    res.render("login", {
      errorMessage: "An error occurred. Please try again.",
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
    res.redirect("/login");
  });
});
//Authentication ends here.

//Genereal routing starts from here.
app.get("/", (req, res) => {
  res.redirect("home");
});

app.get("/home", (req, res) => {
  res.render("home");
});
app.get("/searchPage", (req, res) => {
  res.render("searchPage", { items: [] });
});

app.post("/searchPage", async (req, res) => {
  const search = req.body.search;
  if(search.length > 0){
    var regexPattern = new RegExp(search, "i");
    await Item.find({ $or: [{ name: { $regex: regexPattern } }, { hall: search }, { category: search }] })
      .then((result) => {
        res.render("searchPage", { items: result });
      })
      .catch((err) => console.error(err));
    }
    else{
      res.render("searchPage", { items: [] });
    }
  console.log(req.body);
});

// Hall page route
app.get("/hall-2", (req, res) => {
  res.render("hall-2");
});

// Profile page route
app.get("/profile", async (req, res) => {
  // const id = req.session.userId;
  const id = '65eadd97673a7bf0caf2dc26';
  await User.findById({_id: id})
    .then( async (result) => {
      const favArray = result.fav_items;
      if(favArray.length > 0){
        await Item.find({ _id: { $in: favArray } })
          .then(foundItems => {
            console.log('Found items:', foundItems);
            res.render("profile",{info:result, items : foundItems});
          });
      }
      else{
        res.render("profile",{info:result, items : []});
      }
      console.log(result);
    })
});

//edit profile page route
app.get("/editProfile", (req, res) => {
  res.render("editProfile");
});
