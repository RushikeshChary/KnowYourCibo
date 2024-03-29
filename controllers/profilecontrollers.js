const Item = require("../models/item.js");
const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const {rgbStringToColorName} = require("../helperfunctions.js")


const profileRender = async (req, res) => {
  try {
    const id = req.session.userId;
    const result = await User.findById({ _id: id });

    const favArray = result.fav_items;
    const userFirstName = result.firstName;
    let foundItems = [];

    if (favArray.length > 0) {
      foundItems = await Item.find({ _id: { $in: favArray } });
    }

    res
      .status(200)
      .render("profile", { info: result, items: foundItems, userFirstName });
  } catch (error) {
    console.error("Error in profileRender:", error);
    res.status(500).send("Internal Server Error");
  }
};

const editProfileGet = async (req, res) => {
  const userId = req.session.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      res.redirect("/login");
      return;
    }

    res.status(200).render("editProfile", {
      userFirstName: user.firstName,
      lastName: user.lastName,
      email: user.email, // Assuming you have an email field in your User model
      // Do not send password for security reasons
    });
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

const editProfilePost = async (req, res) => {
  const userId = req.session.userId;
  // const userId = "65eadd97673a7bf0caf2dc26";
  const { firstName, lastName, password, newpassword } = req.body;
  var updatedDetails = {};
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
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
    return res.status(200).json({ message: "Updated details successfully" });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: "Some error occurred in editing profile!! Try again.",
    });
  }
}

const dislikeItem = async (req, res) => {
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
    res.status(400);
    console.log(err);
  }
}

const likeItem =  async (req, res) => {
  const userId = req.session.userId;
  const { item_id , color} = req.body;
  const stringColor = rgbStringToColorName(color)
  if(userId)
  {
    try {
      let newArray = {};
      const user = await User.findById(userId);
      if(stringColor === 'grey')
      {
        newArray = [...user.fav_items, item_id];
        // console.log('added to favorite items');
      }
      else
      {
        newArray = user.fav_items.filter(itemId => itemId !== item_id);
        // console.log('removed from favorite items');

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
      console.log(err);
      res.status(500).json({ error: "An error occurred while processing your request" });
    }
  }
  else
  {
    res.status(400).json({ error: "You are not logged in" });
  }
}

module.exports = { profileRender, editProfileGet ,editProfilePost, dislikeItem, likeItem};
