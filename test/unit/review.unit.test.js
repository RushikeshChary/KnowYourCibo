const { postReview } = require('../../controllers/reviewcontroller');
const Item = require('../../models/item');
const User = require('../../models/user');

// Mock implementations with state
const mockItem = {
  _id: '456',
  reviews: [],
  save: jest.fn().mockImplementation(function() {
    return Promise.resolve(this);
  })
};

const mockUser = {
  _id: '123',
  no_reviews: 0,
  save: jest.fn().mockImplementation(function() {
    return Promise.resolve(this);
  })
};

// Mock the Item and User models
jest.mock('../../models/item', () => ({
  findById: jest.fn()
}));
jest.mock('../../models/user', () => ({
  findById: jest.fn()
}));

// Mock request and response
const mockRequest = (sessionData, bodyData, paramsData) => ({
  session: { ...sessionData },
  body: { ...bodyData },
  params: { ...paramsData }
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Setup the tests
describe('Review Controller', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockItem.reviews = [];
    mockItem.save.mockClear();
    mockUser.no_reviews = 0;
    mockUser.save.mockClear();

    Item.findById.mockResolvedValue(mockItem);
    User.findById.mockResolvedValue(mockUser);
  });

  it('should add the review comment and increment user review count', async () => {
    const req = mockRequest({ userId: '123' }, { comment: 'Great food!' }, { itemId: '456' });
    const res = mockResponse();

    await postReview(req, res);

    // Assertions for review addition
    expect(mockItem.reviews.length).toBe(1);
    expect(mockItem.reviews[0].comment).toBe('Great food!');
    expect(mockItem.save).toHaveBeenCalledTimes(1);

    // Assertions for user's review count
    expect(mockUser.no_reviews).toBe(1);
    expect(mockUser.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.anything());
  });

  
  it('should respond with an error if the item is not found', async () => {
    Item.findById.mockResolvedValue(null); // Simulate item not found
    const req = mockRequest({ userId: '123' }, { comment: 'Great food!' }, { itemId: 'nonexistentItemId' });
    const res = mockResponse();

    await postReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Item not found' });
  });

  it('should respond with an error if the user is not logged in', async () => {
    const req = mockRequest({}, { comment: 'Great food!' }, { itemId: '456' }); // Empty session to simulate user not logged in
    const res = mockResponse();

    await postReview(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'You must be logged in to add a review.' });
  });
});