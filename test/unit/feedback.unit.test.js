// test/unit/feedback.unit.test.js
const request = require('supertest');
const app = require('../../server'); // Adjust the path as necessary
const nodemailer = require('nodemailer');

jest.mock('nodemailer');

describe('Feedback Submission', () => {
  it('sends feedback with correct details via email and redirects to /home', async () => {
    const sendMailMock = jest.fn();
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    const feedbackData = {
      name: 'John Doe',
      email: 'john@example.com',
      feedbackDate: '2023-01-01',
      rating: 5,
      comments: 'Great experience!'
    };

    const response = await request(app)
      .post('/submit-feedback')
      .send(feedbackData);

    const expectedEmailContent = `
      Feedback received from: ${feedbackData.name}
      Email: ${feedbackData.email}
      Date: ${feedbackData.feedbackDate}
      Rating: ${feedbackData.rating}
      Comments: ${feedbackData.comments}
    `;

    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      from: expect.any(String),
      to: 'knowyourcibo@gmail.com',
      subject: "New Feedback Submission",
      text: expect.stringContaining(expectedEmailContent.trim())
    }));

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/home');
  });

  // Additional tests for error handling...
});

