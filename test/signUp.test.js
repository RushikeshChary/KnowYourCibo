const sinon = require('sinon');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Adjust the path as necessary

// Import your User model
const User = require('../models/user'); 

describe('POST /signup', () => {
  let save;

  beforeEach(() => {
    // Mock the save method of User model
    save = sinon.stub(User.prototype, 'save').resolves();
  });

  afterEach(() => {
    save.restore(); // Restore original functionality after each test
  });

  test('should sign up a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    const response = await request(app)
      .post('/signup')
      .send(userData);

    expect(response.statusCode).toBe(200); // Adjust the expected status code
    expect(save.calledOnce).toBeTruthy(); // Verify that save was called
    // Additional assertions can be added as needed
  });

  // More tests...
});


// const request = require('supertest');
// const app = require('../server'); // Adjust the path as necessary

describe('Authentication Routes', () => {
  test('GET /signup returns the signup page', async () => {
    const response = await request(app).get('/signup');
    expect(response.statusCode).toBe(200);
    // Add more assertions here if necessary
  });

  test('GET /login returns the login page', async () => {
    const response = await request(app).get('/login');
    expect(response.statusCode).toBe(200);
    // Add more assertions here if necessary
  });

  test('GET /forgot_password returns the forgot password page', async () => {
    const response = await request(app).get('/forgot_password');
    expect(response.statusCode).toBe(200);
    // Add more assertions here if necessary
  });

  test('GET /logout logs the user out and redirects', async () => {
    const response = await request(app).get('/logout');
    // Depending on your logout implementation, you may expect a redirection or a specific status code
    expect(response.statusCode).toBe(302); // 302 for redirect; adjust as necessary
    expect(response.headers.location).toBe('home'); // Assuming redirection to home page
  });
  

});
