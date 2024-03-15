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
const Feedback = require('./models/feedback.js');
const router = express.Router();
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

// app.use((req, res, next) => {
//   res.locals.path = req.path;
//   next();
// });

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
    res.send(
      "You cannot access this page. Please login or Signup to access user personal pages and to give rating or reviews."
    );
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
  const rest = new Restaurant({
    Restaurant_name: "Hall 2 Canteene",
  });
  rest
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
      no_reviews: 0,
      no_ratings: 0,
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
      no_reviews: 0,
      no_ratings: 0,
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

// app.get("/dashboard", checkLogin, (req, res) => {
//   res.send("Welcome to your Dashboard!");
// });

app.get("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.error("Session destruction error", err);
    }
    res.redirect("/home");
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

// forgot password ends here.

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

// Profile page route
app.get("/profile", checkLogin, async (req, res) => {
  const id = req.session.userId;
  // const id = "65eadd97673a7bf0caf2dc26";
  await User.findById({ _id: id }).then(async (result) => {
    const favArray = result.fav_items;
    const userFirstName = result.firstName;
    if (favArray.length > 0) {
      await Item.find({ _id: { $in: favArray } }).then((foundItems) => {
        // console.log('Found items:', foundItems);
        res.render("profile", { info: result, items: foundItems, userFirstName });
      });
    } else {
      res.render("profile", { info: result, items: [], userFirstName });
    }
    // console.log(result);
  });
});

//Disliking an item in profile page.
app.post("/dislike-item", async (req, res) => {
  const userId = req.session.userId;
  // const userId = "65eadd97673a7bf0caf2dc26";
  const { item_id } = req.body;
  // console.log(item_id);
  try {
    const user = await User.findById(userId);
    const newArray = user.fav_items.filter((item) => item !== item_id);
    // console.log(newArray);
    const updatedDetails = {
      fav_items: newArray,
    };
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedDetails },
      { new: true }
    );
    res.json({ message: "This item will be removed from your favorites" });
  } catch (err) {
    console.error(err);
  }
});


function rgbToColorName(rgbString) {
  // Extracting the RGB values from the string
  const rgbValues = rgbString.match(/\d+/g).map(Number);
  const [r, g, b] = rgbValues;

  // Mapping RGB values to color names
  const colorMap = {
      '0,0,0': 'black',
      '255,255,255': 'white',
      // Add more color mappings as needed
  };

  // Constructing the key for the color map
  const key = `${r},${g},${b}`;

  // Returning the corresponding color name, or the RGB string if no match found
  return colorMap[key] || rgbString;
}


//Liking an item from hall page.
app.post('/like-item', async (req, res) => {
  const userId = req.session.userId;
  const { item_id , color} = req.body;
  const stringColor = rgbToColorName(color);
  if(userId)
  {
    try {
      let newArray = {};
      const user = await User.findById(userId);
      if(stringColor === 'black')
      {
        newArray = [...user.fav_items, item_id];
        console.log('added to favorite items');
      }
      else
      {
        newArray = user.fav_items.filter(itemId => itemId !== item_id);
        console.log('removed from favorite items');

      }
      const updatedDetails = {
        fav_items: newArray,
      };
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updatedDetails },
        { new: true }
      );
      res.status(200).json({ message: "Favorites updated. You can edit from your favorites in your profile page." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "An error occurred while processing your request" });
    }
  }
  else
  {
    res.status(400).json({ error: "You are not logged in" });
  }
});


//edit profile page route
app.get("/editProfile", checkLogin, (req, res) => {
  res.render("editProfile");
});

app.get("/searchpage", (req, res) => {
  res.render("searchPage");
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
      return res.json({
        message:
          "Incorrect password!! Enter correct password to update details",
      });
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
    return res.json({
      error: "Some error occurred in editing profile!! Try again.",
    });
  }
});

app.get("/forgot_password", (req, res) => {
  res.render("forgot_password");
});

app.get("/Feedback", (req, res) => {
  res.render("feedback");
});

app.post('/submit-feedback', async (req, res) => {
  try {
      const newFeedback = new Feedback(req.body);
      await newFeedback.save();
      res.json({ message: 'Feedback submitted successfully.' });
  } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ message: 'Error submitting feedback.' });
  }
});


app.get("/Restaurants", async (req, res) => {
  const res_list = await Restaurant.find({});
  res.render("Restaurants", { res_list });
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
  const item1 = await Item.findById(itemId)
  try {

    if (!item1) {
      return res.status(404).send("Item not found");
    }

    // Assuming 'hall' in the item is the name or ID of the restaurant
    const restaurant = await Restaurant.findOne({ Restaurant_name: item1.hall });

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
    }

    let menu = await Item.find({ hall: item1.hall })
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
    res.render("hall", { restaurant, itemArray, menu ,isLoggedIn, user, scrollToItemId: itemId });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

app.post('/item/:itemId/review', async (req, res) => {
  if (!req.session.userId){ // Assuming you are using Passport.js or similar for authentication
    return res.status(401).json({ success: false, message: 'You must be logged in to add a review.' });
  }
  const { comment } = req.body; // Assuming you're sending the review comment
  const itemId = req.params.itemId;
  const userId = req.session.userId; // Assuming you have a way to identify the logged-in user

  try {
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if the user has already reviewed this item
    const alreadyReviewedIndex = item.reviews.findIndex(review => review.postedBy.toString() === userId.toString());

    if (alreadyReviewedIndex !== -1) {
      // User has already reviewed, update existing review
      item.reviews[alreadyReviewedIndex].comment = comment;
      // Add any other fields you want to update
    } else {
      // Add new review
      item.reviews.push({
        comment: comment,
        postedBy: userId
      });
    }

    await item.save();

    res.status(200).json({ message: 'Review updated successfully', item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
});
app.post('/submit-rating', async (req, res) => {
  const { itemId, rating } = req.body;
  const userId = req.session.userId; // Make sure the user is logged in

  if (!userId) {
    return res.status(401).json({ error: 'User must be logged in to rate items' });
  }

  try {
    const item = await Item.findById(itemId);
    const user = await User.findById(userId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has already rated
    const existingRatingIndex = item.ratings.findIndex(r => r.user.toString() === userId);
    if (existingRatingIndex !== -1) {
      // Update existing rating
      item.ratings[existingRatingIndex].value = rating;
    } else {
      // Add new rating
      item.ratings.push({ user: userId, value: rating });
    }

    // Here, you can increment the number of ratings for the user
    user.no_ratings += 1;

    await item.save();
    await user.save();

    res.status(200).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Error submitting rating' });
  }
});
app.post('/remove-rating', async (req, res) => {
  const { itemId } = req.body;
  const userId = req.session.userId; // Make sure the user is logged in

  if (!userId) {
      return res.status(401).json({ error: 'User must be logged in to remove ratings' });
  }

  try {
      const item = await Item.findById(itemId);
      if (!item) {
          return res.status(404).json({ error: 'Item not found' });
      }

      // Remove the user's rating from the item
      item.ratings = item.ratings.filter(rating => rating.user.toString() !== userId);
      
      await item.save();

      res.json({ message: 'Rating removed successfully' });
  } catch (error) {
      console.error('Error removing rating:', error);
      res.status(500).json({ error: 'Error removing rating' });
  }
});

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

