import express from "express";
import { sendMessage, getMessages, markMessageAsSeen, updateMessage, deleteMessage } from "../controllers/messageController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Send a message to a specific user
router.post("/messages/:receiverId", authMiddleware, sendMessage);

// Get messages for the logged-in user (optionally with a chat partner query)
router.get("/messages/:receiverId", authMiddleware, getMessages);

// Mark message as seen
router.put("/messages/:id/seen", authMiddleware, markMessageAsSeen);

// Update message
router.put("/messages/:id", authMiddleware, updateMessage);

// Delete message
router.delete("/messages/:id", authMiddleware, deleteMessage);

export default router;
