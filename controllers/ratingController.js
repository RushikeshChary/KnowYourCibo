const Item = require('../models/item'); // Adjust path as necessary
const User = require('../models/user'); // Adjust path as necessary

const submitRating = async (req, res) => {
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
      user.no_ratings += 1; // Increment the number of ratings
    }

   

    await item.save();
    await user.save();

    res.status(200).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Error submitting rating' });
  }
};


module.exports = { submitRating };
