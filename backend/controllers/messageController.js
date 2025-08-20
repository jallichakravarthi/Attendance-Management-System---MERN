import Message from "../models/Message.js";
import User from "../models/User.js";

let io; // Socket.IO instance

// Allow setting io from server
export const setIO = (socketIOInstance) => {
  io = socketIOInstance;
};

// Helper to emit message to a chat room
const emitToRoom = (senderId, receiverId, event, payload) => {
  try {
    if (!io) return;
    const room = [senderId.toString(), receiverId.toString()].sort().join("_");
    io.to(room).emit(event, payload);
  } catch (err) {
    console.error("Emit to room error:", err);
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const sender = req.user._id;
    const receiver = req.params.receiverId;
    const { content } = req.body;

    if (!receiver) {
      console.log("Receiver ID is required");
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    if (!content || content.trim().length === 0) {
      console.log("Message content cannot be empty");
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    const receiverExists = await User.exists({ _id: receiver });
    if (!receiverExists) {
      console.log("Recipient not found");
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (sender.toString() === receiver) {
      console.log("Cannot send message to yourself");
      return res.status(400).json({ message: "Cannot send message to yourself" });
    }

    const message = await Message.create({
      sender,
      receiver,
      content: content.trim(),
      seen: false,
      status: 'sent'
    });

    await message.populate('sender', 'name email');
    await message.populate('receiver', 'name email');

    emitToRoom(sender, receiver, "receiveMessage", message);

    res.status(201).json({ status: 'success', data: { message } });
  } catch (err) {
    console.error("SendMessage error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get messages
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const receiverId = req.params.receiverId;

    let filter = {};
    if (receiverId) {
      filter = {
        $or: [
          { sender: userId, receiver: receiverId },
          { sender: receiverId, receiver: userId },
        ],
      };
    } else {
      filter = { $or: [{ sender: userId }, { receiver: userId }] };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    res.status(200).json({ messages });
  } catch (err) {
    console.error("GetMessages error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark message as seen
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByIdAndUpdate(id, { seen: true }, { new: true });

    if (!message) {
      console.log("Message not found");
      return res.status(404).json({ message: "Message not found" });
    }

    emitToRoom(message.sender, message.receiver, "messageSeen", message);
    res.status(200).json({ message });
  } catch (err) {
    console.error("MarkMessageAsSeen error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update message
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const message = await Message.findByIdAndUpdate(id, { content }, { new: true });
    if (!message) {
      console.log("Message not found");
      return res.status(404).json({ message: "Message not found" });
    }

    emitToRoom(message.sender, message.receiver, "messageUpdated", message);
    res.status(200).json({ message });
  } catch (err) {
    console.error("UpdateMessage error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByIdAndDelete(id);

    if (!message) {
      console.log("Message not found");
      return res.status(404).json({ message: "Message not found" });
    }

    emitToRoom(message.sender, message.receiver, "messageDeleted", message);
    res.status(200).json({ message });
  } catch (err) {
    console.error("DeleteMessage error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
