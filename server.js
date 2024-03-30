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
const Restaurant = require("./models/restaurant.js");

const {profileRender,editProfileGet,editProfilePost,dislikeItem,likeItem} = require("./controllers/profilecontrollers.js");
const {postReview} = require("./controllers/reviewcontroller.js")
const {searchResult} = require("./controllers/searchcontroller.js")
const { submitRating } = require('./controllers/ratingController');
const { removeRating } = require('./controllers/removeratingController');
const { signupUser } = require('./controllers/signupController');
const { loginUser } = require('./controllers/loginController.js');
const { sendOtp } = require('./controllers/sendOtpController');
const { verifyOtp } = require('./controllers/verifyOtpController');
const { setPassword } = require('./controllers/setPasswordController');


const app = express();
const router = express.Router();
var otpStore = {}; // Declaration of otpStore

const Port = process.env.PORT || 3000;

// connect to mongodb & listen for requests
// mongoose
//   .connect(process.env.MONGODB_URL)
//   .then((result) =>
//     app.listen(Port, () => {
//       console.log("Database connection established");
//       console.log(`Server is running at http://localhost:${Port}`);
//     })
//   )
//   .catch((err) => console.log(err));

  mongoose
  .connect(process.env.MONGODB_URL)
  .then(result => {
    if (process.env.NODE_ENV !== 'test') {
      app.listen(Port, () => {
        console.log('Database connection established');
        console.log(`Server is running at http://localhost:${Port}`);
      });
    }
  })
  .catch(err => console.log(err));

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
  res.locals.isLoggedIn = req.session.userId ? true : false;
  res.locals.userFirstName = req.session.userFirstName || "";
  next();
});

function checkLogin(req, res, next) {
  if (req.session.userId && req.session) {
    next();
  } else {
    // res.redirect("/login");
    res.status(404).send(
      "You cannot access this page. Please login or Signup to access user personal pages and to give rating or reviews."
    );
  }
}

// const rgbStringToColorName = (rgbString) => {
//   const rgbValues = rgbString.match(/\d+/g).map(Number);
//   if (rgbValues[0] === 128 && rgbValues[1] === 128 && rgbValues[2] === 128) {
//       return 'grey';
//   } else {
//       return 'unknown'; // Or handle other cases accordingly
//   }
// }

//mail settings for sending otp.
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

//Home page.
app.get("/", async (req, res) => {
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

  const res_list = await Restaurant.find({});

  res.render("home", {
    isLoggedIn,
    userFirstName,
    res_list,
    enableAnimations: true // Set true to enable animations for the home route
  });
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

  const res_list = await Restaurant.find({});

  res.render("home", {
    isLoggedIn,
    userFirstName,
    res_list,
    enableAnimations: false // Set false to disable animations for the /home route
  });
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


app.get("/login", async (req, res) => {
  let defaultRedirectUrl = '/home'; // Default redirect URL
  let redirectUrl = req.headers.referer || defaultRedirectUrl;

  // Check if the referrer is the "Forgot Password" page
  // Assuming "/forgot_password" is the path for your "Forgot Password" page
  if (redirectUrl.includes('/forgot_password')) {
    redirectUrl = defaultRedirectUrl; // Set to default if coming from "Forgot Password"
  }
 if (redirectUrl.includes('/signup')) {
    redirectUrl = defaultRedirectUrl; // Set to default if coming from "Forgot Password"
  }
  console.log(redirectUrl);
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        // If user is found, pass user data to the template
        res.render("login", {
          userFirstName: user.firstName,
          isLoggedIn: true,
          errorMessage: "",
          redirect: redirectUrl
        });
      } else {
        // If user is not found, still render the login page but with default values
        res.render("login", {
          userFirstName: "",
          isLoggedIn: false,
          errorMessage: "",
          redirect: redirectUrl
        });
      }
    } else {
      // If there is no session, render the login page with default values
      res.render("login", {
        userFirstName: "",
        isLoggedIn: false,
        errorMessage: "",
        redirect: redirectUrl
      });
    }
  } catch (error) {
    console.error("Error fetching user", error);
    res.render("login", {
      userFirstName: "",
      isLoggedIn: false,
      errorMessage: "An error occurred. Please try again.",
      redirect: redirectUrl
    });
  }
});
app.post("/send-otp", sendOtp);
app.post("/verify-otp", verifyOtp);
app.post("/set-password", setPassword);
app.post("/signup", signupUser);
app.post("/login", loginUser);

app.get("/logout", (req, res) => {
  
  req.session.destroy(function (err) {
    if (err) {
      console.error("Session destruction error", err);
    }
    res.redirect("home");
  });
});
//Authentication ends here.

//forgot password starts

app.post("/send-otp-forgot-password", async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await User.findOne({ email: email });
  if (!user) {
    return res
      .status(404)
      .json({ error: "No account found with that email address." });
  }

  // Generate an OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // OTP expiry time (15 minutes)

  // Store the OTP in your storage system (Here, it's in-memory)
  otpStore[email] = { otp, otpExpires };

  // Send the OTP via email
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER, // Sender address
      to: email, // Receiver address
      subject: "Your Password Reset OTP", // Subject line
      text: `Your OTP for password reset is: ${otp}`, // Plain text body
    });

    res.json({ message: "OTP sent to " + email });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Error sending OTP" });
  }
});

app.post("/verify-otp-forgot-password", async (req, res) => {
  const { email, otp } = req.body;

  // Check if the OTP entry exists for the provided email
  const otpData = otpStore[email];

  if (otpData) {
    // Check if the OTP matches and is not expired
    if (otpData.otp === otp && otpData.otpExpires > new Date()) {
      res.json({
        success: true,
        message: "OTP verified successfully. You can now reset your password.",
      });
    } else {
      // OTP is invalid or expired
      res.status(400).json({ error: "Invalid or expired OTP." });
    }
  } else {
    // No OTP entry found for the provided email
    res.status(400).json({ error: "OTP not found. Please request a new OTP." });
  }
});

app.post("/reset-password", async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;

  // Validate that password and confirmPassword match
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  // Check the OTP validity
  const otpData = otpStore[email];
  if (!otpData || otpData.otp !== otp || otpData.otpExpires < new Date()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update the user's password in the database
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      user.password = hashedPassword;
      await user.save();
      delete otpStore[email]; // Clear the OTP from the store
      res.json({ message: "Password reset successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Error resetting password" });
  }
});
// GET request handler for searchPage
app.get("/searchPage", (req, res) => {
  const referrer = req.headers.referer || '/'; // Default to home if no referrer
  res.render("searchPage", { items: [], referrer: referrer });
});

// POST request handler for searchPage
app.post("/searchPage", searchResult);


app.get("/profile", checkLogin, profileRender);


//Disliking an item in profile page.
app.post("/dislike-item", dislikeItem);


//Liking an item from hall page.
app.post('/like-item', likeItem);


//edit profile page route
app.get("/editProfile", checkLogin, editProfileGet);

app.post("/check-editProfile", editProfilePost);

app.get("/searchpage", (req, res) => {
res.render("searchPage");
});

app.get("/forgot_password", (req, res) => {
  res.render("forgot_password");
});

app.get("/Feedback", (req, res) => {
  res.render("feedback");
});

app.post('/submit-feedback', async (req, res) => {
  try {
    // Destructure the fields from req.body
    const { name, email, feedbackDate, rating, comments } = req.body;
    // Compose the email body
    const emailBody = `
      Feedback received from: ${name}
      Email: ${email}
      Date: ${feedbackDate}
      Rating: ${rating}
      Comments: ${comments}
    `;
    // Send the feedback as an email
    await transporter.sendMail({
      from: process.env.GMAIL_USER, // Sender address
      to: 'knowyourcibo@gmail.com', // Replace with your website's email address
      subject: "New Feedback Submission", // Subject line
      text: emailBody, // Email body with the feedback
    });
    res.redirect('/home');
    // res.json({ message: 'Feedback submitted successfully and emailed.' });
  
  } catch (error) {
    console.error('Error sending feedback email:', error);
     res.status(500).json({ message: 'Error submitting feedback.' });
  }
});

app.get("/Restaurants/:restaurantId", async (req, res) => {
  let userFirstName = "";
  let isLoggedIn = false;
  let user = {};
  let userId = req.session.userId
  if (req.session.userId) {
    try {
      user = await User.findById(req.session.userId);
      userFirstName = user.firstName;
      isLoggedIn = true;
    } catch (error) {
      console.error("Error fetching user for home page", error);
    }
  }
  try {
    const restaurantId = req.params.restaurantId;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).send("Restaurant not found");
    }
    // console.log(restaurant.category);
    const categoryList = restaurant.category;
    // console.log(categoryList);

    const itemArray = {};
    for (const category of categoryList) {
      const itemList = await Item.find({
        hall: restaurant.Restaurant_name,
        category
      })
      .populate({
        path: 'reviews.postedBy',
        select: 'firstName'
      });
      itemArray[category] = itemList;
      
        for (let item of itemList) {
          const itemObj = item.toObject();
          
          // Find user's rating for this item, if it exists
          const userRating = itemObj.ratings.find(rating => rating.user.toString() === userId);
          
          // Add userRatingValue to the item object
          itemObj.userRatingValue = userRating ? userRating.value : null;
          itemObj.userHasRated = !!userRating;
      
          // Calculate total ratings and overall rating
          const totalRatings = itemObj.ratings.length;
          const overallRating = totalRatings > 0 
            ? itemObj.ratings.reduce((acc, curr) => acc + curr.value, 0) / totalRatings 
            : 0;
          
          // Add totalRatings and overallRating to the item object
          itemObj.totalRatings = totalRatings;
          itemObj.overallRating = overallRating;
      
          // Replace the original item with the modified itemObj in the itemList
          const index = itemList.indexOf(item);
          itemList[index] = itemObj;
        }
      
      
      
    }
    
    
    let menu = await Item.find({ hall: restaurant.Restaurant_name})
    .populate({
      path: 'reviews.postedBy',
      select: 'firstName'
    });
    menu = menu.map(item => {
          const itemObj = item.toObject();
          
          // Find user's rating for this item, if it exists
          const userRating = item.ratings.find(rating => rating.user.toString() === userId);
          
          // Add userRatingValue to the item object
          itemObj.userRatingValue = userRating ? userRating.value : null;
          itemObj.userHasRated = !!userRating;
          return itemObj;
      });
      menu.forEach(item => {
        const totalRatings = item.ratings.length;
        const overallRating = totalRatings > 0 ? item.ratings.reduce((acc, curr) => acc + curr.value, 0) / totalRatings : 0;
      
        // Add default values for overallRating and totalRatings
        item.overallRating = overallRating || 0;
        item.totalRatings = totalRatings || 0;
      });
      
    // Now itemArray should be populated with the results of the asynchronous operations

    res.render("hall", { restaurant, itemArray, menu, isLoggedIn, user,scrollToItemId: null});
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

app.get("/search/item/:itemId", async (req, res) => {
  let userFirstName = "";
  let isLoggedIn = false;
  let user = {};
  let userId = req.session.userId
  if (req.session.userId) {
    try {
      user = await User.findById(req.session.userId);
      userFirstName = user.firstName;
      isLoggedIn = true;
    } catch (error) {
      console.error("Error fetching user for home page", error);
    }
  }
  const itemId = req.params.itemId;
  const item = await Item.findById(itemId)
  try {

    if (!item) {
      return res.status(404).send("Item not found");
    }

    // Assuming 'hall' in the item is the name or ID of the restaurant
    const restaurant = await Restaurant.findOne({ Restaurant_name: item.hall });

    if (!restaurant) {
      return res.status(404).send("Restaurant not found");
    }
    const categoryList = restaurant.category;
    const itemArray = {};

    for (const category of categoryList) {
      const itemList = await Item.find({
        hall: restaurant.Restaurant_name,
        category
      })
      .populate({
        path: 'reviews.postedBy',
        select: 'firstName'
      });
      itemArray[category] = itemList;
      
        for (let item of itemList) {
          const itemObj = item.toObject();
          
          // Find user's rating for this item, if it exists
          const userRating = itemObj.ratings.find(rating => rating.user.toString() === userId);
          
          // Add userRatingValue to the item object
          itemObj.userRatingValue = userRating ? userRating.value : null;
          itemObj.userHasRated = !!userRating;
      
          // Calculate total ratings and overall rating
          const totalRatings = itemObj.ratings.length;
          const overallRating = totalRatings > 0 
            ? itemObj.ratings.reduce((acc, curr) => acc + curr.value, 0) / totalRatings 
            : 0;
          
          // Add totalRatings and overallRating to the item object
          itemObj.totalRatings = totalRatings;
          itemObj.overallRating = overallRating;
      
          // Replace the original item with the modified itemObj in the itemList
          const index = itemList.indexOf(item);
          itemList[index] = itemObj;
        }
      
      
      
    }

    let menu = await Item.find({ hall: item.hall })
      .populate({
        path: 'reviews.postedBy',
        select: 'firstName'
      });
      menu = menu.map(item => {
        const itemObj = item.toObject();
        
        // Find user's rating for this item, if it exists
        const userRating = item.ratings.find(rating => rating.user.toString() === userId);
        
        // Add userRatingValue to the item object
        itemObj.userRatingValue = userRating ? userRating.value : null;
        itemObj.userHasRated = !!userRating;
        return itemObj;
    });
    menu.forEach(item => {
      const totalRatings = item.ratings.length;
      const overallRating = totalRatings > 0 ? item.ratings.reduce((acc, curr) => acc + curr.value, 0) / totalRatings : 0;
    
      // Add default values for overallRating and totalRatings
      item.overallRating = overallRating || 0;
      item.totalRatings = totalRatings || 0;
    });
    // Render the same 'hall.ejs' template
       res.render("hall", { restaurant, itemArray, menu,isLoggedIn, user, scrollToItemId: itemId });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

app.post('/item/:itemId/review', postReview);

app.post('/submit-rating', submitRating);


app.post('/remove-rating', removeRating);

router.get('/items', async (req, res) => {
  try {
    const userId = req.session.userId; // Assuming you store logged in userId in session
    let items = await Item.find({}); // Fetch all items, adjust query as needed

    // Augment items with user rating information
    items = items.map(item => {
      const itemObj = item.toObject(); // Convert Mongoose document to plain object
      
      // Find user's rating for this item, if it exists
      const userRating = item.ratings.find(rating => rating.user.toString() === userId);

      // Add userRatingValue property to item object
      itemObj.userRatingValue = userRating ? userRating.value : undefined;

      // Add userHasRated property to easily check in the front end
      itemObj.userHasRated = !!userRating;

      return itemObj;
    });

    res.json(items);
  } catch (error) {
    console.error('Failed to fetch items with user ratings', error);
    res.status(500).send('Error fetching items');
  }
});


module.exports = app;
