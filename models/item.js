const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    hall: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    reviews: [{
      comment: { type: String, required: true },
      postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required:true}
  }],
  },
  { timestamps: true }
);

//Collection name has to be Items.
const Item = mongoose.model("Item", itemSchema);
module.exports = Item;
