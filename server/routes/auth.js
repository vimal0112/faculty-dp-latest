const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const User = require('../models/User');
const { signupValidationRules, handleSignupValidation, loginValidationRules, handleLoginValidation } = require('../validators/signupDto');

// Send password reset email
const sendPasswordResetEmail = async (toEmail, resetUrl, userName) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 SMTP not configured. Reset link would be sent to:', toEmail);
      console.log('   Reset URL:', resetUrl);
      return;
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: toEmail,
      subject: 'Reset Your Password - Faculty FDP Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Dear ${userName},</p>
          <p>You requested a password reset for your Faculty FDP Platform account.</p>
          <p>Click the link below to reset your password (valid for 1 hour):</p>
          <p style="margin: 25px 0;"><a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
          <p>Or copy this link: ${resetUrl}</p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Best regards,<br>Faculty FDP Platform Team</p>
        </div>
      `,
    });
    console.log('✓ Password reset email sent to:', toEmail);
  } catch (error) {
    console.error('✗ Error sending reset email:', error.message);
    throw error;
  }
};

// Login - only TCE emails (@tce.edu or @student.tce.edu) can login
router.post('/login', loginValidationRules, handleLoginValidation, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user data (without password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    res.json({ message: 'Login successful', user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register - DTO validation + TCE email only
router.post('/register', signupValidationRules, handleSignupValidation, async (req, res) => {
  try {
    const { username, name, email, password, role, department, phone } = req.body;

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User with this email already exists', fieldErrors: { email: 'User with this email already exists' } });
    }

    const existingUserByUsername = await User.findOne({ username: username.trim() });
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken', fieldErrors: { username: 'Username already taken' } });
    }

    const user = new User({
      username: username.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      department: department.trim(),
      phone: phone.trim(),
    });

    const savedUser = await user.save();

    const userData = {
      id: savedUser._id,
      username: savedUser.username,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      department: savedUser.department,
      phone: savedUser.phone,
    };

    res.status(201).json({ message: 'User registered successfully', user: userData });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Forgot password - send reset link to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ error: 'please fill out this field', fieldErrors: { email: 'please fill out this field' } });
    }
    const normalizedEmail = email.trim().toLowerCase();

    // Check if it ends with a valid domain
    const validDomains = ['@tce.edu', '@student.tce.edu'];
    if (!validDomains.some(domain => normalizedEmail.endsWith(domain))) {
      return res.status(400).json({ error: 'Only TCE college email addresses (@tce.edu or @student.tce.edu) are allowed', fieldErrors: { email: 'Only TCE college email addresses (@tce.edu or @student.tce.edu) are allowed' } });
    }
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please check your email or sign up.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:8080';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl, user.name);
    res.json({ message: 'Password reset link has been sent to your email. Please check your inbox.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset password - from link in email
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required', fieldErrors: { password: 'please fill out this field' } });
    }
    if (password.length < 8 || !/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return res.status(400).json({ error: 'password must contain 8 characters long (having combination of alphanumeric)', fieldErrors: { password: 'password must contain 8 characters long (having combination of alphanumeric)' } });
    }
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new password reset.' });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
