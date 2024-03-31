const { submitRating } = require('../../controllers/ratingController');
const Item = require('../../models/item');
const User = require('../../models/user');

// Mock the Mongoose models
jest.mock('../../models/item');
jest.mock('../../models/user');

// Helper function to create a mock request
const mockRequest = (sessionData, bodyData) => ({
    session: { ...sessionData },
    body: { ...bodyData },
});

// Helper function to create a mock response
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('submitRating', () => {
    beforeEach(() => {
        // Clear mock instances and calls
        Item.mockClear();
        User.mockClear();
    });

    it('should successfully submit a rating and increment user\'s no_ratings', async () => {
        // Mock implementations
        const mockUser = { _id: 'user123', no_ratings: 5, save: jest.fn() };
        User.findById.mockResolvedValue(mockUser);
        const mockItem = { _id: 'item123', ratings: [], save: jest.fn() };
        Item.findById.mockResolvedValue(mockItem);

        const req = mockRequest({ userId: 'user123' }, { itemId: 'item123', rating: 5 });
        const res = mockResponse();

        await submitRating(req, res);

        // Assertions
        expect(Item.findById).toHaveBeenCalledWith('item123');
        expect(User.findById).toHaveBeenCalledWith('user123');
        expect(mockItem.ratings.length).toBe(1);
        expect(mockUser.no_ratings).toBe(6); // Check if no_ratings is incremented
        expect(mockUser.save).toHaveBeenCalled(); // Ensure user data is saved
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Rating submitted successfully' });
    });

    it('should return an error if user is not logged in', async () => {
        const req = mockRequest({}, { itemId: 'item123', rating: 5 }); // No userId in session
        const res = mockResponse();

        await submitRating(req, res);

        // Assertions
        expect(res.status).toHaveBeenCalledWith(401); // Unauthorized status
        expect(res.json).toHaveBeenCalledWith({ error: 'User must be logged in to rate items' });
    });

    it('should return an error if the item is not found', async () => {
        const req = mockRequest({ userId: 'user123' }, { itemId: 'nonExistentItemId', rating: 4 });
        const res = mockResponse();

        Item.findById.mockResolvedValue(null); // Simulate item not found

        await submitRating(req, res);

        // Assertions
        expect(res.status).toHaveBeenCalledWith(404); // Not Found status
        expect(res.json).toHaveBeenCalledWith({ error: 'Item not found' });
    });
});

describe('submitRating Error Handling', () => {
    it('should respond with an error if there is a server error', async () => {
      // Simulate server error
      const serverError = new Error('Server error');
      Item.findById.mockRejectedValue(serverError);
  
      const req = mockRequest({ userId: 'user123' }, { itemId: 'item123', rating: 5 });
      const res = mockResponse();
  
      await submitRating(req, res);
  
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error submitting rating' });
    });
  });
