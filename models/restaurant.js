const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RestaurantSchema = new Schema({
  Restaurant_name:{
    type: String,
    required: true
  }
},{ timestamps: true });

//Collection name has to be Users.
const Restaurant = mongoose.model("Restaurant", RestaurantSchema);
module.exports = Restaurant;
