const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const sendSMS = require("../utils/sendSMS");
const {
  generateAccessToken,
  generateRefreshToken,
  generateRawAndHashedToken,
  hashToken,
  generateOtp,
} = require("../utils/generateTokens");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
// Set to "true" in .env once you want to actually block unverified users from logging in.
// Defaults to false so the site keeps working out of the box before SMTP is configured.
const REQUIRE_EMAIL_VERIFICATION = process.env.REQUIRE_EMAIL_VERIFICATION === "true";

// Issues both tokens, stores the refresh token's hash on the user, and returns them.
const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please provide name, email and password");
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("An account with this email already exists");
    }

    const safeRole = role === "seller" ? "seller" : "buyer"; // never trust client-sent "admin"

    const user = await User.create({ name, email, password, role: safeRole });

    // Generate and email a verification link
    const { rawToken, hashedToken } = generateRawAndHashedToken();
    user.emailVerificationTokenHash = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${CLIENT_URL}/verify-email?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<p>Hi ${user.name},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    });

    const { accessToken, refreshToken } = await issueTokens(user);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/verify-email?token=...
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      res.status(400);
      throw new Error("Verification token is required");
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationTokenHash +emailVerificationExpires");

    if (!user) {
      res.status(400);
      throw new Error("Verification link is invalid or has expired");
    }

    user.isVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isVerified) {
      res.status(400);
      throw new Error("Email is already verified");
    }

    const { rawToken, hashedToken } = generateRawAndHashedToken();
    user.emailVerificationTokenHash = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${CLIENT_URL}/verify-email?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<p>Please verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    res.json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide email and password");
    }

    const user = await User.findOne({ email }).select("+password");

    // Same error message whether email doesn't exist or password is wrong -
    // prevents attackers from using login to discover which emails are registered.
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("This account has been deactivated");
    }

    if (REQUIRE_EMAIL_VERIFICATION && !user.isVerified) {
      res.status(403);
      throw new Error("Please verify your email before logging in");
    }

    const { accessToken, refreshToken } = await issueTokens(user);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/refresh
// @desc    Exchange a valid refresh token for a new access token
// @access  Public (requires a valid refresh token in the body)
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401);
      throw new Error("Refresh token is required");
    }

    const jwt = require("jsonwebtoken");
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      res.status(401);
      throw new Error("Refresh token is invalid or expired, please log in again");
    }

    const user = await User.findById(decoded.id).select("+refreshTokenHash");
    if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
      // Token doesn't match what's stored - it may have been rotated, revoked, or stolen.
      res.status(401);
      throw new Error("Refresh token is invalid, please log in again");
    }

    // Rotate the refresh token on every use - limits the damage window if one ever leaks
    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshTokenHash: 1 } });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return the same response whether or not the email exists -
    // prevents attackers from using this endpoint to discover registered emails.
    const genericResponse = {
      message: "If an account with that email exists, a reset link has been sent",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const { rawToken, hashedToken } = generateRawAndHashedToken();
    user.resetPasswordTokenHash = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${CLIENT_URL}/reset-password?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>You requested a password reset. Click the link below (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
    });

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400);
      throw new Error("Token and new password are required");
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      resetPasswordTokenHash: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires");

    if (!user) {
      res.status(400);
      throw new Error("Reset link is invalid or has expired");
    }

    user.password = password; // gets hashed automatically by the pre-save hook
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokenHash = undefined; // log out all existing sessions after password change
    await user.save();

    res.json({ message: "Password reset successfully. Please log in with your new password." });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/send-otp
// @desc    Sends a 6-digit SMS OTP to verify the logged-in user's phone number
// @access  Private
const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400);
      throw new Error("Please provide a phone number");
    }

    const user = await User.findById(req.user._id);

    const { otp, hashedOtp } = generateOtp();
    user.phone = phone;
    user.phoneOtpHash = hashedOtp;
    user.phoneOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.phoneOtpAttempts = 0;
    user.isPhoneVerified = false;
    await user.save({ validateBeforeSave: false });

    await sendSMS({ to: phone, body: `Your ${process.env.OTP_SENDER_NAME || "Marketplace"} verification code is ${otp}. It expires in 10 minutes.` });

    res.json({ message: "OTP sent to your phone number" });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/verify-otp
// @access  Private
const verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      res.status(400);
      throw new Error("Please provide the OTP");
    }

    const user = await User.findById(req.user._id).select(
      "+phoneOtpHash +phoneOtpExpires +phoneOtpAttempts"
    );

    if (!user.phoneOtpHash || !user.phoneOtpExpires) {
      res.status(400);
      throw new Error("No OTP was requested. Please request a new one.");
    }

    if (user.phoneOtpExpires < Date.now()) {
      res.status(400);
      throw new Error("OTP has expired. Please request a new one.");
    }

    // Locks out after 5 wrong guesses - a 6-digit OTP has a million combinations,
    // so unlimited attempts would make it brute-forceable within the 10-minute window.
    if (user.phoneOtpAttempts >= 5) {
      res.status(429);
      throw new Error("Too many incorrect attempts. Please request a new OTP.");
    }

    if (hashToken(otp) !== user.phoneOtpHash) {
      user.phoneOtpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      res.status(400);
      throw new Error("Incorrect OTP");
    }

    user.isPhoneVerified = true;
    user.phoneOtpHash = undefined;
    user.phoneOtpExpires = undefined;
    user.phoneOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    res.json({ message: "Phone number verified successfully" });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/auth/profile
// @desc    Update name, phone, and address (not email/password - those have their own flows)
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, profilePicture } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (address) {
      user.address = {
        street: address.street ?? user.address?.street,
        city: address.city ?? user.address?.city,
        country: address.country ?? user.address?.country,
        postalCode: address.postalCode ?? user.address?.postalCode,
      };
    }

    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/auth/change-password
// @desc    Change password while logged in (different from the forgot-password email flow)
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error("Please provide your current and new password");
    }
    if (newPassword.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }

    user.password = newPassword; // hashed automatically by the pre-save hook
    user.refreshTokenHash = undefined; // log out other sessions after a password change
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerification,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
};
