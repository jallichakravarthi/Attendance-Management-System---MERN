import User from "../models/User.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import sgTransport from "nodemailer-sendgrid-transport";
import InvitedUser from "../models/InvitedUser.js";
import bcrypt from "bcryptjs";

import dotenv from "dotenv";
dotenv.config();

/** Register user */
export const register = async (req, res) => {
  console.log("Register attempt");
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password){
      console.log("All fields are required");
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: email , isActive: true});
    if (existingUser){
      console.log("User already exists");
      return res.status(400).json({ message: "User already exists" });
    }
    const invitedUser = await InvitedUser.findOne({ email :email});
    if (!invitedUser){
      console.log("User not invited");
      return res.status(400).json({ message: "User not invited" });
    }

    // Create user but don't activate yet
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      isActive: false // User is inactive until OTP is verified
    });

    // Generate and send OTP
    const otp = await newUser.generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    newUser.otp = {
      code: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    await newUser.save();

    try {
      const transporter = nodemailer.createTransport(
        sgTransport({ auth: { api_key: process.env.SENDGRID_API_KEY } })
      );

      await transporter.sendMail({
        to: newUser.email,
        from: process.env.EMAIL_FROM || "22501a1240@pvpsit.ac.in",
        subject: "Verify Your Email - OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Thank you for registering. Please use the following OTP to verify your email:</p>
            <div style="background: #f4f4f4; padding: 10px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 5px;">
              ${otp}
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      // For development, include OTP in response
      return res.status(201).json({
        success: true,
        message: "OTP has been sent to your email",
        userId: newUser._id,
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return res.status(201).json({
        success: true,
        message: "User registered. Failed to send OTP email.",
        userId: newUser._id,
        otp, // Include OTP in response in case email fails
      });
    }
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** 
 * resend OTP
 */
export const resendOtp = async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) return res.status(400).json({ message: "User ID is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = await user.generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.otp = {
      code: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    await user.save();

    try {
      const transporter = nodemailer.createTransport(
        sgTransport({ auth: { api_key: process.env.SENDGRID_API_KEY } })
      );

      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_FROM || "22501a1240@pvpsit.ac.in",
        subject: "Verify Your Email - OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Thank you for registering. Please use the following OTP to verify your email:</p>
            <div style="background: #f4f4f4; padding: 10px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 5px;">
              ${otp}
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      // For development, include OTP in response
      return res.status(201).json({
        success: true,
        message: "OTP has been sent to your email",
        userId: user._id,
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return res.status(201).json({
        success: true,
        message: "User registered. Failed to send OTP email.",
        userId: user._id,
        otp, // Include OTP in response in case email fails
      });
    }
  } catch (err) {
    console.error("ResendOtp error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Verify OTP and activate user */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if(!user.verifyOtp(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Activate user
    user.isActive = true;
    await user.resetOtp();
    const token = user.generateToken();
    await user.save();

    res.status(200).json({
      message: "Email verified successfully",
      user: user.toJSONSafe(),
      token,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Login user */
export const login = async (req, res) => {
  console.log("Login attempt");
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = await User.findOne({ email });
    if (!user){
      console.log("user not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!user.isActive){
      console.log("account disabled");
      return res.status(403).json({ message: "Account disabled" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch){
      console.log("password not matched");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = user.generateToken();
    await user.save();

    res.status(200).json({ user: user.toJSONSafe(), token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Logout */
export const logout = async (req, res) => {
  try {
    req.user.token = undefined;
    await req.user.save();
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Forgot password */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(200).json({
        message: "If account exists, reset link has been sent",
      });

    const resetToken = user.generateResetToken();
    await user.save();

    const transporter = nodemailer.createTransport(
      sgTransport({ auth: { api_key: process.env.SENDGRID_API_KEY } })
    );

    await transporter.sendMail({
      to: user.email,
      from: "22501a1240@pvpsit.ac.in",
      subject: "Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_PATH}/reset-password?token=${resetToken}"
               style="background-color: #007BFF; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
               Reset Password
            </a>
          </div>
          <p>This link will expire in 10 minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p style="color: #888; font-size: 12px;">&copy; ${new Date().getFullYear()} YourApp. All rights reserved.</p>
        </div>
      `
    });
    

    res.status(200).json({
      message: "If account exists, reset link has been sent",
    });
  } catch (err) {
    console.error("ForgotPassword error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Reset password */
export const resetPassword = async (req, res) => {
  console.log("Reset password attempt");
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password)
      return res.status(400).json({ message: "All fields required" });

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
      "resetToken.token": hashedToken,
      "resetToken.expiresAt": { $gt: Date.now() },
    });

    console.log(user);

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const isMatch = await user.comparePassword(password);
    console.log("isMatch", isMatch);
    if (isMatch) {
      return res.status(400).json({ message: "New password cannot be same as old password" });
    }

    await user.resetPassword(password);
    await user.save();
    console.log(password);
    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("ResetPassword error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Get my profile */
export const getMyUser = async (req, res) => {
  try {
    res.status(200).json({ user: req.user.toJSONSafe() });
  } catch (err) {
    console.error("GetMyUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Update profile */
export const updateProfile = async (req, res) => {
  try {
    const { name, contact, address, profilePic } = req.body;
    req.user.name = name || req.user.name;
    req.user.contact = contact || req.user.contact;
    req.user.address = address || req.user.address;
    req.user.profilePic = profilePic || req.user.profilePic;
    await req.user.save();

    res.status(200).json({ message: "Profile updated", user: req.user.toJSONSafe() });
  } catch (err) {
    console.error("UpdateProfile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Search users */
export const searchUser = async (req, res) => {
  try {
    const { name, email, role } = req.query;
    let query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (email) query.email = { $regex: email, $options: "i" };
    if (role) query.role = role;

    const users = await User.find(query).select("-password -resetToken -token -facePrint");
    res.status(200).json({ users });
  } catch (err) {
    console.error("SearchUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Get other user by ID */
export const getOtherUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password -resetToken -token -facePrint");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    console.error("GetOtherUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Register face (placeholder) */
export const registerFace = async (req, res) => {
  try {
    if (req.user.facePrint) return res.status(400).json({ message: "Face already registered" });
    // TODO: integrate face recognition logic
    res.status(200).json({ message: "Face registered successfully (mock)" });
  } catch (err) {
    console.error("RegisterFace error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Update User (admin) */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive ?? user.isActive;
    await user.save();
    res.status(200).json({ user });
  } catch (err) {
    console.error("UpdateUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Delete User (admin) */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error("DeleteUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


