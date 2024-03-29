const request = require('supertest');
const app = require('../../server'); // Adjust the path as necessary
const { otpStore } = require('../../controllers/sendOtpController');

describe('Verify OTP Controller', () => {
  beforeEach(() => {
    otpStore['test@example.com'] = {
      otp: '123456',
      otpExpires: new Date(Date.now() + 15 * 60 * 1000),
      firstName: 'John',
      lastName: 'Doe'
    };
  });

  it('verifies a valid OTP', async () => {
    const response = await request(app)
      .post('/verify-otp')
      .send({ email: 'test@example.com', otp: '123456' });

    expect(response.body.success).toBeTruthy();
    expect(response.statusCode).toBe(200);
  });

  it('rejects an invalid OTP', async () => {
    const response = await request(app)
      .post('/verify-otp')
      .send({ email: 'test@example.com', otp: 'invalid' });

    expect(response.body.success).toBeFalsy();
    expect(response.statusCode).toBe(400);
  });

  // Additional tests for expired OTP...
});
