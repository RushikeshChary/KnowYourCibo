const { removeRating } = require('../../controllers/removeratingController');
const Item = require('../../models/item');
const User = require('../../models/user');

jest.mock('../../models/item');
jest.mock('../../models/user');

const mockRequest = (sessionData, bodyData) => ({
  session: { ...sessionData },
  body: { ...bodyData }
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Remove Rating', () => {
  let mockItem, mockUser;

  beforeEach(() => {
    mockItem = {
      ratings: [{ user: 'user123', value: 5 }],
      save: jest.fn().mockResolvedValue(true)
    };
    mockUser = {
      _id: 'user123',
      no_ratings: 1,
      save: jest.fn().mockResolvedValue(true)
    };

    Item.findById.mockResolvedValue(mockItem);
    User.findById.mockResolvedValue(mockUser);
  });

  it('should successfully remove a rating', async () => {
    const req = mockRequest({ userId: 'user123' }, { itemId: 'item123' });
    const res = mockResponse();

    await removeRating(req, res);

    // Assertions
    expect(Item.findById).toHaveBeenCalledWith('item123');
    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(mockItem.ratings).toEqual([]); // Check that the rating array is now empty
    expect(mockItem.save).toHaveBeenCalled(); // Check if save method was called on the item
    expect(mockUser.no_ratings).toBe(0); // User's rating count should be decremented
    expect(mockUser.save).toHaveBeenCalled(); // Check if save method was called on the user
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Rating removed successfully' });
  });

  // Additional test cases for removeRating

// Test case when the user is not logged in
it('should respond with an error if the user is not logged in', async () => {
  const req = mockRequest({}, { itemId: 'item123' }); // No userId in session
  const res = mockResponse();

  await removeRating(req, res);

  // Assertions
  expect(res.status).toHaveBeenCalledWith(401); // Unauthorized status
  expect(res.json).toHaveBeenCalledWith({ error: 'User must be logged in to remove ratings' });
});

// Test case when the item is not found
it('should respond with an error if the item is not found', async () => {
  const req = mockRequest({ userId: 'user123' }, { itemId: 'nonExistentItemId' });
  const res = mockResponse();

  Item.findById.mockResolvedValue(null); // Simulate item not found

  await removeRating(req, res);

  // Assertions
  expect(res.status).toHaveBeenCalledWith(404); // Not Found status
  expect(res.json).toHaveBeenCalledWith({ error: 'Item not found' });
});

});