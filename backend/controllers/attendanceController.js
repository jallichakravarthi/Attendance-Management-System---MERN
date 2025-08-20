import Attendance from "../models/Attendance.js";

// Create attendance
export const createAttendance = async (req, res) => {
    try {
        const { user, date, status, leaveType, method } = req.body;
        if (!user || !date || !status)
            return res.status(400).json({ message: "All fields are required" });

        const attendance = await Attendance.create({ user, date, status, leaveType, method });
        res.status(201).json({ attendance });
    } catch (err) {
        console.error("CreateAttendance error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all attendance (admin/hod)
export const getAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find();
        res.status(200).json({ attendance });
    } catch (err) {
        console.error("GetAttendance error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update attendance by ID (admin/hod)
export const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.findById(id);
        if (!attendance) return res.status(404).json({ message: "Attendance not found" });

        attendance.user = req.body.user || attendance.user;
        attendance.date = req.body.date || attendance.date;
        attendance.status = req.body.status || attendance.status;
        attendance.leaveType = req.body.leaveType || attendance.leaveType;
        attendance.method = req.body.method || attendance.method;

        await attendance.save();
        res.status(200).json({ attendance });
    } catch (err) {
        console.error("UpdateAttendance error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete attendance by ID (admin/hod)
export const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.findByIdAndDelete(id);
        if (!attendance) return res.status(404).json({ message: "Attendance not found" });

        res.status(200).json({ message: "Attendance deleted" });
    } catch (err) {
        console.error("DeleteAttendance error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get attendance by user ID (admin/hod)
export const getAttendanceByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.find({ user: id });
        if (!attendance.length) return res.status(404).json({ message: "Attendance not found" });

        res.status(200).json({ attendance });
    } catch (err) {
        console.error("GetAttendanceByUser error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get attendance by specific date (admin/hod)
export const getAttendanceByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const attendance = await Attendance.find({ date: { $gte: start, $lte: end } });
        if (!attendance.length) return res.status(404).json({ message: "Attendance not found" });

        res.status(200).json({ attendance });
    } catch (err) {
        console.error("GetAttendanceByDate error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get attendance by month and year (admin/hod)
export const getAttendanceByMonth = async (req, res) => {
    try {
        const { month, year } = req.params; // month: 1-12, year: 2025
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999); // last day of month

        const attendance = await Attendance.find({ date: { $gte: start, $lte: end } });
        if (!attendance.length) return res.status(404).json({ message: "Attendance not found" });

        res.status(200).json({ attendance });
    } catch (err) {
        console.error("GetAttendanceByMonth error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get logged-in user's attendance
export const getMyAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ user: req.user.id });
        if (!attendance.length) return res.status(404).json({ message: "Attendance not found" });

        res.status(200).json({ attendance });
    } catch (err) {
        console.error("GetMyAttendance error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
