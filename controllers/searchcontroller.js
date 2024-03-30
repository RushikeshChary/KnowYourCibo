const Item = require("../models/item.js");
const User = require("../models/user.js");


const searchResult = async (req, res) => {
  const search = req.body.search;
  const referrer = req.body.referrer || "/"; // Get referrer from form input or default to home

  if (search.length > 0) {
    var regexPattern = new RegExp(search, "i");
    try {
      const items = await Item.find({
        $or: [
          { name: { $regex: regexPattern } },
          { hall: { $regex: regexPattern } },
          { category: search },
        ],
      });
      res.render("searchPage", { items: items, referrer: referrer });
    } catch (err) {
      console.log(err);
      res.render("searchPage", { items: [], referrer: referrer });
    }
  } else {
    res.render("searchPage", { items: [], referrer: referrer });
  }
};

module.exports = {searchResult};
