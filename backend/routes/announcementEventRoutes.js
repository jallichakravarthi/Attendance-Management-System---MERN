import express from "express";
import {
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncement,
    getAnnouncementById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    getEventById
} from "../controllers/announcementEventController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Announcement routes
router.post("/create-announcement", authMiddleware, roleMiddleware(["admin", "hod"]), createAnnouncement);
router.put("/update-announcement/:id", authMiddleware, roleMiddleware(["admin", "hod"]), updateAnnouncement);
router.delete("/delete-announcement/:id", authMiddleware, roleMiddleware(["admin", "hod"]), deleteAnnouncement);
router.get("/get-announcement", authMiddleware, getAnnouncement);
router.get("/get-announcement-by-id/:id", authMiddleware, getAnnouncementById);

// Event routes
router.post("/create-event", authMiddleware, roleMiddleware(["admin", "hod"]), createEvent);
router.put("/update-event/:id", authMiddleware, roleMiddleware(["admin", "hod"]), updateEvent);
router.delete("/delete-event/:id", authMiddleware, roleMiddleware(["admin", "hod"]), deleteEvent);
router.get("/get-event", authMiddleware, getEvent);
router.get("/get-event-by-id/:id", authMiddleware, getEventById);

export default router;