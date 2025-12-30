const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const dotenv = require('dotenv');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'User with this email does not exist' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 600000); // 10 minutes

        await User.saveOTP(email, otp, otpExpiry);

        // Email Transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2d5bff;">Password Reset Request</h2>
                    <p>You requested to reset your password. Use the OTP below to proceed:</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #1a1c21; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #666;">This OTP will expire in <strong>10 minutes</strong>.</p>
                    <p style="color: #666;">If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            res.json({ message: 'OTP sent to your email.' });
        } else {
            console.log('Skipping email send (no credentials). OTP:', otp);
            res.json({ message: 'OTP generated (check server console for OTP in dev mode).', testOTP: otp });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findByEmailAndOTP(email, otp);
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully', email });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.resetPasswordWithOTP = async (req, res) => {
    const { email, otp, password } = req.body;

    try {
        const user = await User.findByEmailAndOTP(email, otp);
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Check if new password is same as old password
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return res.status(400).json({ error: 'New password cannot be the same as your current password' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.updatePassword(user.id, hashedPassword);
        await User.clearOTP(email);

        res.json({ message: 'Password reset successfully. You can now login.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.signup = async (req, res) => {
    let { username, email, password, mobile_number } = req.body;
    username = username?.trim();
    email = email?.trim().toLowerCase();
    password = password?.trim();
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await User.create({
            username,
            email,
            password: hashedPassword,
            mobile_number
        });
        res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Internal Server Error1234432' });
    }
};

exports.login = async (req, res) => {
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();
    password = password?.trim();
    console.log('Login attempt for email:', email);
    try {
        const user = await User.findByEmail(email);
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', validPassword);

        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { id: user.id, username: user.username, email: user.email, profile_image: user.profile_image } });
    } catch (error) {
        console.error('Login error details:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateProfile = async (req, res) => {
    const { username, email, mobile_number } = req.body;
    const profile_image = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
        const updateData = { username, email, mobile_number };
        if (profile_image) {
            updateData.profile_image = profile_image;
        }

        const success = await User.update(req.user.id, updateData);
        if (!success) return res.status(404).json({ error: 'User not found or no changes made' });

        // Return the updated profile image so frontend can update state immediately
        res.json({ message: 'Profile updated successfully', profile_image });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const googleService = require('../services/googleCalendarService');

exports.googleAuth = (req, res) => {
    // Pass the JWT as state so we can identify the user in the callback
    const state = req.headers.authorization?.split(' ')[1];
    const url = googleService.getAuthUrl(state);
    res.json({ url });
};

exports.googleCallback = async (req, res) => {
    const { code, state } = req.query;
    try {
        // Verify the state (which is our JWT)
        const decoded = jwt.verify(state, JWT_SECRET);
        const tokens = await googleService.getTokens(code);
        const refreshToken = tokens.refresh_token;

        if (refreshToken) {
            await User.update(decoded.id, { google_refresh_token: refreshToken });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/profile?google=success`);
    } catch (error) {
        console.error('Google callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/profile?google=error`);
    }
};

exports.disconnectGoogle = async (req, res) => {
    try {
        await User.update(req.user.id, { google_refresh_token: null });
        res.json({ message: 'Google Calendar disconnected successfully' });
    } catch (error) {
        console.error('Disconnect Google error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

