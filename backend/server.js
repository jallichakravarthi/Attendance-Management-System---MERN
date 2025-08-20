import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Server } from "socket.io";
import Message from "./models/Message.js";
import * as messageController from "./controllers/messageController.js"; // import controller

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Basic middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import routes
import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import scheduleHolidayRoutes from "./routes/scheduleHolidayController.js";
import invitedUserRoutes from "./routes/invitedUserRoutes.js";
import announcementEventRoutes from "./routes/announcementEventRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/schedule-holiday", scheduleHolidayRoutes);
app.use("/api/invited-user", invitedUserRoutes);
app.use("/api/announcement-event", announcementEventRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/message", messageRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "success", message: "Server is running" });
});

// Handle unhandled routes
app.use((req, res) => {
  res
    .status(404)
    .json({ message: `Can't find ${req.originalUrl} on this server!` });
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_PATH,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Pass io to controller
if (typeof messageController.setIO === "function") {
  messageController.setIO(io);
}

// Track online users
const onlineUsers = new Map();

const broadcastOnlineUsers = () => {
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));
};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // User comes online
  socket.on("userOnline", (userId) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    broadcastOnlineUsers();
  });

  // Join chat room
  socket.on("joinRoom", ({ userId, partnerId }) => {
    const room = [userId, partnerId].sort().join("_");
    socket.join(room);
  });

  // Send message
  socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
    if (!content) return;
    try {
      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
        seen: false,
      });
      const room = [senderId, receiverId].sort().join("_");
      io.to(room).emit("receiveMessage", message);
    } catch (err) {
      console.error("sendMessage error:", err);
    }
  });

  // Mark as seen
  socket.on("markAsSeen", async ({ messageId }) => {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { seen: true },
        { new: true }
      );
      if (message) {
        const room = [message.sender.toString(), message.receiver.toString()]
          .sort()
          .join("_");
        io.to(room).emit("messageSeen", message);
      }
    } catch (err) {
      console.error("markAsSeen error:", err);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (let [userId, sockets] of onlineUsers.entries()) {
      sockets.delete(socket.id);
      if (sockets.size === 0) onlineUsers.delete(userId);
    }
    broadcastOnlineUsers();
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
