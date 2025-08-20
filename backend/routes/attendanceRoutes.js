import express from "express";
import {
  createAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByUser,
  getAttendanceByDate,
  getAttendanceByMonth,
  getMyAttendance
} from "../controllers/attendanceController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin / HOD routes
router.post("/create-attendance", authMiddleware, roleMiddleware(["admin","hod"]), createAttendance);
router.get("/get-attendance", authMiddleware, roleMiddleware(["admin","hod"]), getAttendance);
router.put("/update-attendance/:id", authMiddleware, roleMiddleware(["admin","hod"]), updateAttendance);
router.delete("/delete-attendance/:id", authMiddleware, roleMiddleware(["admin","hod"]), deleteAttendance);
router.get("/get-attendance-by-user/:id", authMiddleware, roleMiddleware(["admin","hod"]), getAttendanceByUser);
router.get("/get-attendance-by-date/:date", authMiddleware, roleMiddleware(["admin","hod"]), getAttendanceByDate);
router.get("/get-attendance-by-month/:month/:year", authMiddleware, roleMiddleware(["admin","hod"]), getAttendanceByMonth);

// Logged-in user route
router.get("/get-my-attendance", authMiddleware, getMyAttendance);

export default router;
