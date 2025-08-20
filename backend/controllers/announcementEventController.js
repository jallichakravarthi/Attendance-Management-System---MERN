import Announcement from "../models/Announcement.js";
import Event from "../models/Event.js";

/**
 * ANNOUNCEMENTS
 */

// Create Announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetRoles } = req.body;
    if (!title || !content || !targetRoles)
      return res.status(400).json({ message: "Title, content and targetRoles are required" });

    const announcement = await Announcement.create({
      title,
      content,
      targetRoles,
      postedBy: req.user._id,
      readBy: [] // Initialize empty
    });

    res.status(201).json({ announcement });
  } catch (err) {
    console.error("CreateAnnouncement error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Announcement (partial updates allowed)
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    ["title", "content", "targetRoles"].forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const announcement = await Announcement.findByIdAndUpdate(id, updates, { new: true });
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    res.status(200).json({ announcement });
  } catch (err) {
    console.error("UpdateAnnouncement error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    res.status(200).json({ message: "Announcement deleted", announcement });
  } catch (err) {
    console.error("DeleteAnnouncement error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all Announcements
export const getAnnouncement = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json({ announcements });
  } catch (err) {
    console.error("GetAnnouncement error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Announcement by ID
export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    res.status(200).json({ announcement });
  } catch (err) {
    console.error("GetAnnouncementById error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark Announcement as read
export const markAnnouncementRead = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    if (!announcement.readBy.includes(req.user._id)) {
      announcement.readBy.push(req.user._id);
      await announcement.save();
    }

    res.status(200).json({ message: "Marked as read", announcement });
  } catch (err) {
    console.error("MarkAnnouncementRead error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * EVENTS
 */

// Create Event
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, location } = req.body;
    if (!title || !date)
      return res.status(400).json({ message: "Title and date are required" });

    const event = await Event.create({
      title,
      description,
      date,
      time,
      location,
      postedBy: req.user._id
    });

    res.status(201).json({ event });
  } catch (err) {
    console.error("CreateEvent error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Event (partial updates allowed)
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    ["title", "description", "date", "time", "location"].forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const event = await Event.findByIdAndUpdate(id, updates, { new: true });
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ event });
  } catch (err) {
    console.error("UpdateEvent error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Event deleted", event });
  } catch (err) {
    console.error("DeleteEvent error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all Events
export const getEvent = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json({ events });
  } catch (err) {
    console.error("GetEvent error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ event });
  } catch (err) {
    console.error("GetEventById error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
