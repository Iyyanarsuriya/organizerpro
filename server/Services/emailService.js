const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendEmail = async (to, subject, html) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ EMAIL credentials missing. Email not sent to:', to);
        return false;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('📧 Email sent to:', to);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return false;
    }
};
