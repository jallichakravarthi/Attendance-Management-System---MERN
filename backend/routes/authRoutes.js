import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  registerFace,
  getMyUser,
  searchUser,
  getOtherUser,
  updateProfile,
  verifyOtp,
  updateUser,
  deleteUser,
  resendOtp,
} from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Auth routes
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);
router.post("/logout", authMiddleware, logout);
router.post("/register-face", authMiddleware, registerFace);
router.get("/get-my-user", authMiddleware, getMyUser);
router.get("/search-user", authMiddleware, searchUser);
router.get("/get-other-user/:id", authMiddleware, getOtherUser);
router.put("/update-profile", authMiddleware, updateProfile);
router.post("/resend-otp", resendOtp);

// Admin-only routes
router.put("/update-user/:id", authMiddleware, roleMiddleware(["admin"]), updateUser);
router.delete("/delete-user/:id", authMiddleware, roleMiddleware(["admin"]), deleteUser);

export default router;

