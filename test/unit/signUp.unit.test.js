const request = require('supertest');
const app = require('../../server'); // Adjust path as necessary
const User = require('../../models/user');
const bcrypt = require('bcryptjs');

jest.mock('../../models/user', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'mockUserId', /* other user data */ })
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword')
}));

describe('Signup Controller', () => {
  beforeEach(() => {
    User.create.mockClear();
    bcrypt.hash.mockClear();
  });

  it('should create a new user and return 200 status code', async () => {
    const mockUserData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    const response = await request(app)
      .post('/signup')
      .send(mockUserData);

    expect(response.statusCode).toBe(200);
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: expect.any(String) // Since password is hashed
    }));
  });
  it('should return a 400 status code when required fields are missing', async () => {
    const response = await request(app).post('/signup').send({
      firstName: 'Test',
      lastName: 'User',
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain("Please fill in all the fields.");
  });

  it('should handle User.create failures gracefully', async () => {
    User.create.mockRejectedValue(new Error('Mocked create error'));
    
    const response = await request(app)
      .post('/signup')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    expect(response.statusCode).toBe(500);
    expect(response.text).toContain("Error signing up user.");
  });

 
});




