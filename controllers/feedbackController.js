const nodemailer = require('nodemailer');

async function submitFeedback(req, res) {
  try {
    const { name, email, feedbackDate, rating, comments } = req.body;

    // Check if all required fields are filled
    if (!name || !email || !feedbackDate || !rating ) {
      return res.status(400).json({ message: 'You should fill the boxes completely' });
    }

    const currentDateTime = new Date();
    const providedFeedbackDate = new Date(feedbackDate);
    if (providedFeedbackDate > currentDateTime) {
      return res.status(400).json({ message: 'Feedback date cannot be a future date.' });
    }

    const emailBody = `
      Feedback received from: ${name}
      Email: ${email}
      Date: ${feedbackDate}
      Rating: ${rating}
      Comments: ${comments}
    `;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'knowyourcibo@gmail.com',
      subject: "New Feedback Submission",
      text: emailBody,
    });

    res.redirect('/home');
  } catch (error) {
    console.error('Error sending feedback email:', error);
    res.status(500).json({ message: 'Error submitting feedback.' });
  }
}

module.exports = { submitFeedback };
