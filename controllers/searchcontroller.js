const Item = require("../models/item.js");
const User = require("../models/user.js");
const Fuse = require("fuse.js");

const searchResult = async (req, res) => {
  const search = req.body.search;
  const referrer = req.body.referrer || "/"; // Get referrer from form input or default to home

  if (search.length > 0) {
    try {
      const items = await Item.find(); // Retrieve all items from the database
      const fuse = new Fuse(items, {
        keys: ["name", "hall", "category"], // Specify the keys you want to search in
        includeScore: true, // Include score for each result
        threshold: 0.4, // Adjust this value to fine-tune the fuzzy search threshold
      });
      const searchResults = fuse.search(search);
      const filteredItems = searchResults.map((result) => result.item);
      res.render("searchPage", { items: filteredItems, referrer: referrer });
    } catch (err) {
      console.log(err);
      res.render("searchPage", { items: [], referrer: referrer });
    }
  } else {
    res.render("searchPage", { items: [], referrer: referrer });
  }
};

module.exports = { searchResult };
