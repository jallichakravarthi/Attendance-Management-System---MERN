import Schedule from "../models/Schedule.js";
import Holiday from "../models/Holiday.js";

// ------------------- Schedule Controllers ------------------- //

export const createSchedule = async (req, res) => {
    try {
        const { semester, regulation, section, batch, department, year, slots } = req.body;
        if (!semester || !regulation || !section || !batch || !department || !year || !slots) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate slots format
        for (const slot of slots) {
            if (!slot.courseTitle || !slot.courseCode || !slot.faculty || !slot.weekday || !slot.startTime || !slot.endTime) {
                return res.status(400).json({ message: "All slot fields are required" });
            }
            // Validate time format HH:mm
            const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
                return res.status(400).json({ message: "Invalid time format in slots" });
            }
        }

        const schedule = await Schedule.create({
            semester,
            regulation,
            section,
            batch,
            department,
            year,
            slots,
            createdBy: req.user._id
        });

        res.status(201).json({ schedule });
    } catch (err) {
        console.error("CreateSchedule error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSchedule = async (req, res) => {
    try {
        const schedules = await Schedule.find().populate("slots.faculty", "name email");
        res.status(200).json({ schedules });
    } catch (err) {
        console.error("GetSchedule error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findById(id);
        if (!schedule) return res.status(404).json({ message: "Schedule not found" });

        Object.assign(schedule, req.body);
        await schedule.save();
        res.status(200).json({ schedule });
    } catch (err) {
        console.error("UpdateSchedule error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByIdAndDelete(id);
        if (!schedule) return res.status(404).json({ message: "Schedule not found" });
        res.status(200).json({ message: "Schedule deleted" });
    } catch (err) {
        console.error("DeleteSchedule error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getScheduleBySemesterBatchSection = async (req, res) => {
    try {
        const { semester, section, batch } = req.params;
        const schedules = await Schedule.find({ semester, section, batch }).populate("slots.faculty", "name email");
        res.status(200).json({ schedules });
    } catch (err) {
        console.error("GetScheduleBySemesterBatchSection error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------- Holiday Controllers ------------------- //

export const createHoliday = async (req, res) => {
    try {
        const { title, date, description } = req.body;
        if (!title || !date) return res.status(400).json({ message: "Title and date are required" });

        // Prevent duplicate holidays
        const existing = await Holiday.findOne({ date });
        if (existing) return res.status(400).json({ message: "Holiday already exists on this date" });

        const holiday = await Holiday.create({ title, date, description });
        res.status(201).json({ holiday });
    } catch (err) {
        console.error("CreateHoliday error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getHoliday = async (req, res) => {
    try {
        const holidays = await Holiday.find();
        res.status(200).json({ holidays });
    } catch (err) {
        console.error("GetHoliday error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const holiday = await Holiday.findById(id);
        if (!holiday) return res.status(404).json({ message: "Holiday not found" });

        Object.assign(holiday, req.body);
        await holiday.save();
        res.status(200).json({ holiday });
    } catch (err) {
        console.error("UpdateHoliday error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const holiday = await Holiday.findByIdAndDelete(id);
        if (!holiday) return res.status(404).json({ message: "Holiday not found" });
        res.status(200).json({ message: "Holiday deleted" });
    } catch (err) {
        console.error("DeleteHoliday error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
