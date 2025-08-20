import express from "express";
import {
  createSchedule,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleBySemesterBatchSection,
  createHoliday,
  getHoliday,
  updateHoliday,
  deleteHoliday
} from "../controllers/scheduleHolidayController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Schedule Routes
router.post("/create-schedule", authMiddleware, roleMiddleware(["admin","hod"]), createSchedule);
router.get("/get-schedule", authMiddleware, roleMiddleware(["admin","hod"]), getSchedule);
router.put("/update-schedule/:id", authMiddleware, roleMiddleware(["admin","hod"]), updateSchedule);
router.delete("/delete-schedule/:id", authMiddleware, roleMiddleware(["admin","hod"]), deleteSchedule);
router.get(
  "/get-schedule-by-semester-batch-section/:semester/:batch/:section",
  authMiddleware,
  roleMiddleware(["admin","hod"]),
  getScheduleBySemesterBatchSection
);

// Holiday Routes
router.post("/create-holiday", authMiddleware, roleMiddleware(["admin"]), createHoliday);
router.get("/get-holiday", authMiddleware, roleMiddleware(["admin"]), getHoliday);
router.put("/update-holiday/:id", authMiddleware, roleMiddleware(["admin"]), updateHoliday);
router.delete("/delete-holiday/:id", authMiddleware, roleMiddleware(["admin"]), deleteHoliday);

export default router;

