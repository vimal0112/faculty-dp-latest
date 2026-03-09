const express = require("express");
const crypto = require("crypto");
const { Resend } = require("resend");

const router = express.Router();
const User = require("../models/User");
const {
  signupValidationRules,
  handleSignupValidation,
  loginValidationRules,
  handleLoginValidation,
} = require("../validators/signupDto");

const resend = new Resend(process.env.RESEND_API_KEY);

/* ---------------- SEND RESET EMAIL ---------------- */

const sendPasswordResetEmail = async (toEmail, resetUrl, userName) => {
  try {
    await resend.emails.send({
      from: "Faculty Platform <onboarding@resend.dev>",
      to: toEmail,
      subject: "Reset Your Password - Faculty FDP Platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Password Reset Request</h2>

          <p>Dear ${userName},</p>

          <p>You requested a password reset for your Faculty FDP Platform account.</p>

          <p>Click the button below to reset your password (valid for 1 hour).</p>

          <p style="margin:25px 0;">
            <a href="${resetUrl}" 
            style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>

          <p>If the button doesn't work, copy this link:</p>

          <p>${resetUrl}</p>

          <p>If you did not request this reset, please ignore this email.</p>

          <p>Best regards,<br>Faculty FDP Platform Team</p>
        </div>
      `,
    });

    console.log("✓ Password reset email sent to:", toEmail);
  } catch (error) {
    console.error("✗ Email sending failed:", error);
    throw error;
  }
};

/* ---------------- LOGIN ---------------- */

router.post(
  "/login",
  loginValidationRules,
  handleLoginValidation,
  async (req, res) => {
    try {
      const { email, password, role } = req.body;

      const user = await User.findOne({ email, role });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      };

      res.json({ message: "Login successful", user: userData });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/* ---------------- REGISTER ---------------- */

router.post(
  "/register",
  signupValidationRules,
  handleSignupValidation,
  async (req, res) => {
    try {
      const { username, name, email, password, role, department, phone } =
        req.body;

      const existingUserByEmail = await User.findOne({ email });

      if (existingUserByEmail) {
        return res.status(400).json({
          error: "User with this email already exists",
          fieldErrors: { email: "User with this email already exists" },
        });
      }

      const existingUserByUsername = await User.findOne({
        username: username.trim(),
      });

      if (existingUserByUsername) {
        return res.status(400).json({
          error: "Username already taken",
          fieldErrors: { username: "Username already taken" },
        });
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

      res
        .status(201)
        .json({ message: "User registered successfully", user: userData });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/* ---------------- FORGOT PASSWORD ---------------- */

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        error: "please fill out this field",
        fieldErrors: { email: "please fill out this field" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const validDomains = ["@tce.edu", "@student.tce.edu"];

    if (!validDomains.some((domain) => normalizedEmail.endsWith(domain))) {
      return res.status(400).json({
        error:
          "Only TCE college email addresses (@tce.edu or @student.tce.edu) are allowed",
        fieldErrors: {
          email:
            "Only TCE college email addresses (@tce.edu or @student.tce.edu) are allowed",
        },
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        error: "No account found with this email. Please check your email.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "https://faculty-dp-frontend.onrender.com";

    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, resetUrl, user.name);

    res.json({
      message: "Password reset link has been sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- RESET PASSWORD ---------------- */

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: "Token and new password are required",
        fieldErrors: { password: "please fill out this field" },
      });
    }

    if (
      password.length < 8 ||
      !/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)
    ) {
      return res.status(400).json({
        error:
          "password must contain 8 characters long (having combination of alphanumeric)",
        fieldErrors: {
          password:
            "password must contain 8 characters long (having combination of alphanumeric)",
        },
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset link.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message: "Password reset successful. You can now login.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- GET CURRENT USER ---------------- */

router.get("/me", async (req, res) => {
  try {
    const userId = req.headers["user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;