const Item = require('../models/item'); // Adjust the path as needed
const User = require('../models/user'); // Adjust the path as needed

const postReview = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'You must be logged in to add a review.' });
  }

  const { comment } = req.body;
  const itemId = req.params.itemId;
  const userId = req.session.userId;

  try {
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const alreadyReviewedIndex = item.reviews.findIndex(review => review.postedBy.toString() === userId.toString());
    if (alreadyReviewedIndex !== -1) {
      item.reviews[alreadyReviewedIndex].comment = comment;
    } else {
      item.reviews.push({ comment: comment, postedBy: userId });
      const user = await User.findById(userId);
      user.no_reviews += 1;
      await user.save();
    }

    await item.save();
    res.status(200).json({ message: 'Review updated successfully', item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
};

module.exports = { postReview };