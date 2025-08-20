import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    profilePic: { type: String },
    contact: { type: String },
    address: { type: String },
    facePrint: { type: [Number] },
    role: {
      type: String,
      enum: ["admin", "hod", "prof", "asst.prof", "lab technician", "peon"],
      required: true,
    },
    department: { type: String, default: "IT" },
    joiningDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    token: {
      value: { type: String },
      createdAt: { type: Date },
      expiresAt: { type: Date },
    },
    resetToken: {
      token: { type: String },
      createdAt: { type: Date },
      expiresAt: { type: Date },
    },
    otp: {
      code: { type: String },
      createdAt: { type: Date },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  this.token = { 
    value: token, 
    createdAt: new Date(), 
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) 
  };
  return token;
};

userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetToken = {
    token: crypto.createHash("sha256").update(resetToken).digest("hex"),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  return resetToken;
};

userSchema.methods.resetPassword = async function (password) {
  this.password = password;
  this.resetToken = undefined;
  return this;
};

userSchema.methods.generateOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 min
  };
  return otp;
};

userSchema.methods.verifyOtp = function (otp) {
  if (!this.otp) return false;
  const now = new Date();
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  return hashedOTP === this.otp.code && this.otp.expiresAt > now;
};

userSchema.methods.toJSONSafe = function () {
  const user = this.toObject();
  delete user.password;
  delete user.token;
  delete user.resetToken;
  delete user.otp;
  return user;
};

userSchema.methods.resetOtp = async function () {
  this.otp = undefined;
  await this.save();
  return this;
};

export default mongoose.model("User", userSchema);
