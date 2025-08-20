import express from "express";
import {
  createLeave,
  getLeave,
  updateLeave,
  deleteLeave,
  getLeaveByUser,
  getLeaveByDate,
  getLeaveByMonth,
  acceptLeave,
  rejectLeave,
  getMyLeave,
  updateMyLeave,
  deleteMyLeave
} from "../controllers/leaveController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Create leave
router.post("/create-leave", authMiddleware, createLeave);

// My leave routes (logged-in user)
router.get("/get-my-leave", authMiddleware, getMyLeave);
router.put("/update-my-leave/:leaveId", authMiddleware, updateMyLeave);
router.delete("/delete-my-leave/:leaveId", authMiddleware, deleteMyLeave);

// Admin / HOD routes
router.get("/get-leave", authMiddleware, roleMiddleware(["admin","hod"]), getLeave);
router.put("/update-leave/:id", authMiddleware, roleMiddleware(["admin","hod"]), updateLeave);
router.delete("/delete-leave/:id", authMiddleware, roleMiddleware(["admin","hod"]), deleteLeave);
router.get("/get-leave-by-user/:id", authMiddleware, roleMiddleware(["admin","hod"]), getLeaveByUser);
router.get("/get-leave-by-date/:date", authMiddleware, roleMiddleware(["admin","hod"]), getLeaveByDate);
router.get("/get-leave-by-month/:month/:year", authMiddleware, roleMiddleware(["admin","hod"]), getLeaveByMonth);
router.put("/accept-leave/:id", authMiddleware, roleMiddleware(["admin","hod"]), acceptLeave);
router.put("/reject-leave/:id", authMiddleware, roleMiddleware(["admin","hod"]), rejectLeave);

export default router;

