const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true
  },
  email: { type: String, unique: true, required: true },
  password: {
    type: String,
    required: true
  },
  no_reviews:
  {
    type: Number
  },
  no_ratings:
  {
    type: Number
  },
  fav_items:
  {
    type: Array
  },
  otpExpires: Date, // Timestamp to validate OTP expiry

},{ timestamps: true });

//Collection name has to be Users.
const User = mongoose.model("User", userSchema);
module.exports = User;
