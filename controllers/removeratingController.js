const Item = require('../models/item'); // Adjust the path as needed
const User = require('../models/user'); // Adjust the path as needed

const removeRating = async (req, res) => {
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
  
      const user = await User.findById(userId);
      user.no_ratings -= 1;
      await user.save();
  
      res.status(200).json({ message: 'Rating removed successfully' });
    } catch (error) {
      console.error('Error removing rating:', error);
      res.status(500).json({ error: 'Error removing rating' });
    }
  };
  
  module.exports = { removeRating };