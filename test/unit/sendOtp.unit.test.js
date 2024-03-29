const request = require('supertest');
const app = require('../../server'); // Adjust the path as necessary
const nodemailer = require('nodemailer');
const { otpStore } = require('../../controllers/sendOtpController');

jest.mock('nodemailer');

describe('Send OTP Controller', () => {
  it('sends an OTP to the provided email', async () => {
    const sendMailMock = jest.fn();
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    const response = await request(app)
      .post('/send-otp')
      .send({ email: 'test@example.com', firstName: 'John', lastName: 'Doe' });

    expect(sendMailMock).toHaveBeenCalled();
    expect(otpStore['test@example.com']).toBeDefined();
    expect(response.statusCode).toBe(200);
  });

  // Additional tests for error cases...
});
