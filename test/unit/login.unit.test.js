// test/unit/login.unit.test.js
const request = require('supertest');
const app = require('../../server'); // Adjust the path as necessary
const User = require('../../models/user');
const bcrypt = require('bcryptjs');

jest.mock('../../models/user', () => ({
  findOne: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));

describe('Login Controller', () => {
  beforeEach(() => {
    User.findOne.mockClear();
    bcrypt.compare.mockClear();
  });

  it('allows a user with correct details to log in', async () => {
    User.findOne.mockResolvedValue({
      _id: '123',
      password: 'hashedPassword',
      firstName: 'TestUser'
    });
    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    // Assuming successful login redirects or sends a success response
    expect(response.statusCode).toBe(302); // Adjust based on your app's behavior
  });

  it('prevents a user with incorrect details from logging in', async () => {
    User.findOne.mockResolvedValue({
      _id: '123',
      password: 'hashedPassword',
      firstName: 'TestUser'
    });
    bcrypt.compare.mockResolvedValue(false); // Password does not match

    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com', password: 'wrongPassword' });

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
    expect(response.statusCode).toBe(401); // Assuming a 401 status for failed login
  });

  // Additional tests can be added for other scenarios, like user not found
});
