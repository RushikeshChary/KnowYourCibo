const request = require('supertest');
const app = require('../../server'); // Adjust the path as necessary
const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const { otpStore } = require('../../controllers/sendOtpController');

jest.mock('../../models/user');
jest.mock('bcryptjs');

describe('Set Password Controller', () => {
  beforeEach(() => {
    otpStore['test@example.com'] = {
      otp: '123456',
      otpExpires: new Date(Date.now() + 15 * 60 * 1000),
      firstName: 'John',
      lastName: 'Doe'
    };
    User.create.mockClear();
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashedPassword');
  });

  it('sets a new password for the user', async () => {
    const response = await request(app)
      .post('/set-password')
      .send({ email: 'test@example.com', password: 'newPassword', confirmPassword: 'newPassword' });

    expect(User.create).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it('rejects if passwords do not match', async () => {
    const response = await request(app)
      .post('/set-password')
      .send({ email: 'test@example.com', password: 'newPassword', confirmPassword: 'wrong' });

    expect(response.statusCode).toBe(400);
  });
it('requires OTP verification if OTP is missing', async () => {
    delete otpStore['test@example.com']; // Make sure OTP is not present

    const response = await request(app)
      .post('/set-password')
      .send({ email: 'test@example.com', password: 'newPassword', confirmPassword: 'newPassword' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("OTP verification required");
  });

  // Additional tests for missing OTP verification...
});
