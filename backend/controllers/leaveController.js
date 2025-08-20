import Leave from "../models/Leave.js";

/**
 * Create a leave (user or admin can create)
 */
export const createLeave = async (req, res) => {
  try {
    const user = req.body.user || req.user.id; // default to logged-in user
    const { type, fromDate, toDate, reason } = req.body;

    if (!type || !fromDate || !toDate || !reason)
      return res.status(400).json({ message: "All fields are required" });

    const leave = await Leave.create({ user, type, fromDate, toDate, reason });
    res.status(201).json({ leave });
  } catch (err) {
    console.error("CreateLeave error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all leaves (admin)
 */
export const getLeave = async (req, res) => {
  try {
    const leaves = await Leave.find().populate("user", "name email");
    res.status(200).json({ leaves });
  } catch (err) {
    console.error("GetLeave error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get leaves by user (admin)
 */
export const getLeaveByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const leaves = await Leave.find({ user: id });
    res.status(200).json({ leaves });
  } catch (err) {
    console.error("GetLeaveByUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get leaves by a specific date
 */
export const getLeaveByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const target = new Date(date);
    const leaves = await Leave.find({
      fromDate: { $lte: target },
      toDate: { $gte: target }
    });
    res.status(200).json({ leaves });
  } catch (err) {
    console.error("GetLeaveByDate error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get leaves by month
 */
export const getLeaveByMonth = async (req, res) => {
  try {
    const { month, year } = req.params; // month: 1-12
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const leaves = await Leave.find({
      fromDate: { $lt: end },
      toDate: { $gte: start }
    });
    res.status(200).json({ leaves });
  } catch (err) {
    console.error("GetLeaveByMonth error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Accept leave (admin)
 */
export const acceptLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.status = "approved";
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    await leave.save();

    res.status(200).json({ leave });
  } catch (err) {
    console.error("AcceptLeave error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Reject leave (admin)
 */
export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.status = "rejected";
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    await leave.save();

    res.status(200).json({ leave });
  } catch (err) {
    console.error("RejectLeave error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get logged-in user's leaves
 */
export const getMyLeave = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user.id });
    res.status(200).json({ leaves });
  } catch (err) {
    console.error("GetMyLeave error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update logged-in user's specific leave
 */
export const updateMyLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const leave = await Leave.findOne({ _id: leaveId, user: req.user.id });
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.type = req.body.type || leave.type;
    leave.fromDate = req.body.fromDate || leave.fromDate;
    leave.toDate = req.body.toDate || leave.toDate;
    leave.reason = req.body.reason || leave.reason;

    await leave.save();
    res.status(200).json({ leave });
  } catch (err) {
    console.error("UpdateMyLeave error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete logged-in user's specific leave
 */
export const deleteMyLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const leave = await Leave.findOneAndDelete({ _id: leaveId, user: req.user.id });
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    res.status(200).json({ message: "Leave deleted" });
  } catch (err) {
    console.error("DeleteMyLeave error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findByIdAndDelete(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    res.status(200).json({ message: "Leave deleted" });
  } catch (err) {
    console.error("DeleteLeave error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.type = req.body.type || leave.type;
    leave.fromDate = req.body.fromDate || leave.fromDate;
    leave.toDate = req.body.toDate || leave.toDate;
    leave.reason = req.body.reason || leave.reason;

    await leave.save();
    res.status(200).json({ leave });
  } catch (err) {
    console.error("UpdateLeave error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

